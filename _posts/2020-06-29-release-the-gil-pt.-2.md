---
layout: post
title: "Release the GIL: Pybind11, PyO3"
description: "More Python Parallelism"
category:
tags: [python, rust, c++]
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
[a template](https://github.com/speice-io/release-the-gil-pybind11/settings) for future projects.

There's a great deal of overlap between Pybind11 and Cython. Where Pybind11 makes it easy for C++ to
interact with the interpreter, Cython uses a Python-like language to facilitate interaction with
C++. Another way of thinking about is like this: Pybind11 is for C++ developers who want to interact
with Python, and Cython is for Python developers who want to interact with C++.

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
  std::uint64_t c = a + b;

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

PYBIND11_MODULE(speiceio_pybind11, m) {

  m.def("fibonacci_gil", &fibonacci_gil, R"pbdoc(
        Calculate the Nth Fibonacci number while implicitly holding the GIL
    )pbdoc");

  m.def("fibonacci_nogil", &fibonacci_nogil,
        R"pbdoc(
        Calculate the Nth Fibonacci number after explicitly unlocking the GIL
    )pbdoc");

#ifdef VERSION_INFO
  m.attr("__version__") = VERSION_INFO;
#else
  m.attr("__version__") = "dev";
#endif
}
```

After building the C++ module, those functions can be used to demonstrate the effect of unlocking
the GIL.

```python
# The billionth Fibonacci number overflows `std::uint64_t`, but that's OK;
# our purpose is keeping the CPU busy, not getting the correct result.
N = 1_000_000_000;

from speiceio_pybind11 import fibonacci_gil, fibonacci_nogil
```

Even though two threads are used, the GIL prevents those threads from running in parallel:

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

Because the elapsed ("wall") time is effectively the same as the time spent executing on the CPU
("user"), there was no benefit to using multiple threads.

However, if one thread unlocks the GIL first, the Python interpreter is allowed to execute the
second thread in parallel:

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

The CPU time ("user") hasn't changed much, but the elapsed time ("wall") is effectively cut in half.

Caution is advised though; attempting to unlock the GIL when it isn't locked will terminate the
current process:

```c++
void recurse_unlock() {
  py::gil_scoped_release release;
  return recurse_unlock();
}
```

> <pre>
> Python 3.8.2 (default, Apr 27 2020, 15:53:34) 
> [GCC 9.3.0] on linux
> Type "help", "copyright", "credits" or "license" for more information.
> >>> from speiceio_pybind11 import recurse_unlock
> >>> recurse_unlock()
> Fatal Python error: PyEval_SaveThread: NULL tstate
> Python runtime state: initialized
> 
> Current thread 0x00007f213a627740 (most recent call first):
> File "<stdin>", line 1 in <module>
>  [1]    34943 abort (core dumped)  python
> </pre>

# PyO3

```rust
use pyo3::prelude::*;
use pyo3::wrap_pyfunction;

fn fibonacci_impl(n: u64) -> u64 {
    if n <= 1 {
        return n;
    }

    let mut a: u64 = 0;
    let mut b: u64 = 1;
    let mut c: u64 = a + b;

    for _i in 2..n {
        a = b;
        b = c;
        // We're not particularly concerned about the actual result, just in keeping the
        // processor busy.
        c = a.overflowing_add(b).0;
    }

    c
}

#[pyfunction]
fn fibonacci_gil(n: u64) -> PyResult<u64> {
    // The GIL is implicitly held here
    Ok(fibonacci_impl(n))
}

#[pyfunction]
fn fibonacci_nogil(py: Python, n: u64) -> PyResult<u64> {
    // Explicitly release the GIL
    py.allow_threads(|| Ok(fibonacci_impl(n)))
}

#[pymodule]
fn speiceio_pyo3(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_wrapped(wrap_pyfunction!(fibonacci_gil))?;
    m.add_wrapped(wrap_pyfunction!(fibonacci_nogil))?;

    Ok(())
}
```

```python
N = 1_000_000_000;

from speiceio_pyo3 import fibonacci_gil, fibonacci_nogil
```

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
> CPU times: user 503 ms, sys: 3.83 ms, total: 507 ms
> Wall time: 506 ms
> </pre>

```python
%%time

t1 = Thread(target=fibonacci_nogil, args=[N])
t2 = Thread(target=fibonacci_gil, args=[N])
t1.start(); t2.start()
t1.join(); t2.join()
```

> <pre>
> CPU times: user 501 ms, sys: 3.96 ms, total: 505 ms
> Wall time: 252 ms
> </pre>

Interestingly enough, Rust's borrow rules actually _prevent_ double-unlocking because the GIL handle
can't be transferred across threads:

```rust
fn recursive_unlock(py: Python) -> PyResult<()> {
    py.allow_threads(|| recursive_unlock(py))
}
```

> <pre>
> error[E0277]: `std::rc::Rc<()>` cannot be shared between threads safely
>   --> src/lib.rs:38:8
>    |
> 38 |     py.allow_threads(|| recursive_unlock(py))
>    |        ^^^^^^^^^^^^^ `std::rc::Rc<()>` cannot be shared between threads safely
>    |
>    = help: within `pyo3::python::Python<'_>`, the trait `std::marker::Sync` is not implemented for `std::rc::Rc<()>`
> </pre>
