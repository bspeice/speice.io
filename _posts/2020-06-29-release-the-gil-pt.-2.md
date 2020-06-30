---
layout: post
title: "Release the GIL: Part 2 - Pybind11, PyO3"
description: "More Python Parallelism"
category:
tags: [python]
---

I've been continuing experiments with parallelism in Python; while these techniques are a bit niche,
it's still fun to push the performance envelope. In addition to tools like
[Cython](https://cython.org/) and [Numba](https://numba.pydata.org/) (covered
[here](//2019/12/release-the-gil.html)) that attempt to stay as close to Python as possible, other
projects are available that act as a bridge between Python and other languages. The goal is to make
cooperation simple without compromising independence.

In practice, this "cooperation" between languages is important for performance reasons. Code written
in C++ shouldn't have to care about the Python GIL. However, unless the GIL is explicitly unlocked,
it will remain implicitly held; though the Python interpreter _could_ be making progress on a
separate thread, it will be stuck waiting on the current operation to complete. We'll look at some
techniques below for managing the GIL in a Python extension.

# Pybind11

The motto of [Pybind11](https://github.com/pybind/pybind11) is "seamless operability between C++11
and Python", and they certainly deliver on that. Setting up a hybrid project where C++ (using CMake)
and Python (using setuptools) could coexist was straight-forward, and the repository also works as
[a template](LINK HERE) for future projects.

Just like the previous post, we'll examine a simple Fibonacci sequence implementation to demonstrate
how Python's threading model interacts with Pybind11:

```c++
#include <cstdint>
#include <pybind11/pybind.h>

inline std::uint64_t fibonacci(std::uint64_t n) {
  if (n <= 1) {
    return n;
  }

  std::uint64_t a = 0;
  std::uint64_t b = 1;
  std::uint64_t c = 0;

  c = a + b;
  for (std::uint64_t _i = 2; _i < n; _i++) {
    a = b;
    b = c;
    c = a + b;
  }

  return c;
}

std::uint64_t fibonacci_gil(std::uint64_t n) {
  // The GIL is held by default when entering C++ from Python, so we need no
  // manipulation here. Interestingly enough, re-acquiring a held GIL is a safe
  // operation (within the same thread), so feel free to scatter
  // `py::gil_scoped_acquire` throughout the code.
  return fibonacci(n);
}

std::uint64_t fibonacci_nogil(std::uint64_t n) {
  // Because the GIL is held by default, we need to explicitly release it here
  // to run in parallel.
  // WARNING: Releasing the lock multiple times will crash the process.

  py::gil_scoped_release release;
  return fibonacci(n);
}
```

Admittedly, the project setup is significantly more involved than Cython or Numba. I've omitted
those steps here, but the full project is available at [INSERT LINK HERE].

```python
# The billionth Fibonacci number overflows `std::uint64_t`, but that's OK;
# our purpose is keeping the CPU busy, not getting the correct result.
N = 1_000_000_000;

from speiceio_pybind11 import fibonacci_gil, fibonacci_nogil
```

We'll first run each function independently:

```python
%%time
_ = fibonacci_gil(N);
```

> <pre>
> CPU times: user 350 ms, sys: 3.54 ms, total: 354 ms
> Wall time: 355 ms
> </pre>

```python
%%time
_ = fibonacci_nogil(N);
```

> <pre>
> CPU times: user 385 ms, sys: 0 ns, total: 385 ms
> Wall time: 384 ms
> </pre>

There's some minor variation in how long it takes to run the code, but not a material difference.
When running the same function in multiple threads, we expect the run time to double; even though
there are multiple threads, they effectively run in serial because of the GIL:

```python
%%time
from threading import Thread

# Create the two threads to run on
t1 = Thread(target=fibonacci_gil, args=[N])
t2 = Thread(target=fibonacci_gil, args=[N])
# Start the threads
t1.start(); t2.start()
# Wait for the threads to finish
t1.join(); t2.join()
```

> <pre>
> CPU times: user 709 ms, sys: 0 ns, total: 709 ms
> Wall time: 705 ms
> </pre>

However, if one thread unlocks the GIL first, then the threads will execute in parallel:

```python
%%time

t1 = Thread(target=fibonacci_nogil, args=[N])
t2 = Thread(target=fibonacci_gil, args=[N])
t1.start(); t2.start()
t1.join(); t2.join()
```

> <pre>
> CPU times: user 734 ms, sys: 7.89 ms, total: 742 ms
> Wall time: 372 ms
> </pre>

While it takes the same amount of CPU time to compute the result ("user" time), the run time ("wall"
time) is cut in half because the code is now running in parallel.

```python
%%time

# Note that the GIL-locked version is started first
t1 = Thread(target=fibonacci_gil, args=[N])
t2 = Thread(target=fibonacci_nogil, args=[N])
t1.start(); t2.start()
t1.join(); t2.join()
```

> <pre>
> CPU times: user 736 ms, sys: 0 ns, total: 736 ms
> Wall time: 734 ms
> </pre>

Finally, it's import to note that scheduling matters; in this example, threads run in serial because
the GIL-locked thread is started first.
