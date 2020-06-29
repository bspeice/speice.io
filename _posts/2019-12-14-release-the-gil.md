---
layout: post
title: "Release the GIL"
description: "Strategies for Parallelism in Python"
category:
tags: [python]
---

Complaining about the [Global Interpreter Lock](https://wiki.python.org/moin/GlobalInterpreterLock)
(GIL) seems like a rite of passage for Python developers. It's easy to criticize a design decision
made before multi-core CPU's were widely available, but the fact that it's still around indicates
that it generally works [Good](https://wiki.c2.com/?PrematureOptimization)
[Enough](https://wiki.c2.com/?YouArentGonnaNeedIt). Besides, there are simple and effective
workarounds; it's not hard to start a
[new process](https://docs.python.org/3/library/multiprocessing.html) and use message passing to
synchronize code running in parallel.

Still, wouldn't it be nice to have more than a single active interpreter thread? In an age of
asynchronicity and _M:N_ threading, Python seems lacking. The ideal scenario is to take advantage of
both Python's productivity and the modern CPU's parallel capabilities.

Presented below are two strategies for releasing the GIL's icy grip without giving up on what makes
Python a nice language to start with. Bear in mind: these are just the tools, no claim is made about
whether it's a good idea to use them. Very often, unlocking the GIL is an
[XY problem](https://en.wikipedia.org/wiki/XY_problem); you want application performance, and the
GIL seems like an obvious bottleneck. Remember that any gains from running code in parallel come at
the expense of project complexity; messing with the GIL is ultimately messing with Python's memory
model.

```python
%load_ext Cython
from numba import jit

N = 1_000_000_000
```

# Cython

Put simply, [Cython](https://cython.org/) is a programming language that looks a lot like Python,
gets [transpiled](https://en.wikipedia.org/wiki/Source-to-source_compiler) to C/C++, and integrates
well with the [CPython](https://en.wikipedia.org/wiki/CPython) API. It's great for building Python
wrappers to C and C++ libraries, writing optimized code for numerical processing, and tons more. And
when it comes to managing the GIL, there are two special features:

- The `nogil`
  [function annotation](https://cython.readthedocs.io/en/latest/src/userguide/external_C_code.html#declaring-a-function-as-callable-without-the-gil)
  asserts that a Cython function is safe to use without the GIL, and compilation will fail if it
  interacts with Python in an unsafe manner
- The `with nogil`
  [context manager](https://cython.readthedocs.io/en/latest/src/userguide/external_C_code.html#releasing-the-gil)
  explicitly unlocks the CPython GIL while active

Whenever Cython code runs inside a `with nogil` block on a separate thread, the Python interpreter
is unblocked and allowed to continue work elsewhere. We'll define a "busy work" function that
demonstrates this principle in action:

```python
%%cython

# Annotating a function with `nogil` indicates only that it is safe
# to call in a `with nogil` block. It *does not* release the GIL.
cdef unsigned long fibonacci(unsigned long n) nogil:
    if n <= 1:
        return n

    cdef unsigned long a = 0, b = 1, c = 0

    c = a + b
    for _i in range(2, n):
        a = b
        b = c
        c = a + b

    return c


def cython_nogil(unsigned long n):
    # Explicitly release the GIL while running `fibonacci`
    with nogil:
        value = fibonacci(n)

    return value


def cython_gil(unsigned long n):
    # Because the GIL is not explicitly released, it implicitly
    # remains acquired when running the `fibonacci` function
    return fibonacci(n)
```

First, let's time how long it takes Cython to calculate the billionth Fibonacci number:

```python
%%time
_ = cython_gil(N);
```

> <pre>
> CPU times: user 365 ms, sys: 0 ns, total: 365 ms
> Wall time: 372 ms
> </pre>

```python
%%time
_ = cython_nogil(N);
```

> <pre>
> CPU times: user 381 ms, sys: 0 ns, total: 381 ms
> Wall time: 388 ms
> </pre>

Both versions (with and without GIL) take effectively the same amount of time to run. Even when
running this calculation in parallel on separate threads, it is expected that the run time will
double because only one thread can be active at a time:

```python
%%time
from threading import Thread

# Create the two threads to run on
t1 = Thread(target=cython_gil, args=[N])
t2 = Thread(target=cython_gil, args=[N])
# Start the threads
t1.start(); t2.start()
# Wait for the threads to finish
t1.join(); t2.join()
```

> <pre>
> CPU times: user 641 ms, sys: 5.62 ms, total: 647 ms
> Wall time: 645 ms
> </pre>

However, if the first thread releases the GIL, the second thread is free to acquire it and run in
parallel:

```python
%%time

t1 = Thread(target=cython_nogil, args=[N])
t2 = Thread(target=cython_gil, args=[N])
t1.start(); t2.start()
t1.join(); t2.join()
```

> <pre>
> CPU times: user 717 ms, sys: 372 µs, total: 718 ms
> Wall time: 358 ms
> </pre>

Because `user` time represents the sum of processing time on all threads, it doesn't change much.
The ["wall time"](https://en.wikipedia.org/wiki/Elapsed_real_time) has been cut roughly in half
because each function is running simultaneously.

Keep in mind that the **order in which threads are started** makes a difference!

```python
%%time

# Note that the GIL-locked version is started first
t1 = Thread(target=cython_gil, args=[N])
t2 = Thread(target=cython_nogil, args=[N])
t1.start(); t2.start()
t1.join(); t2.join()
```

> <pre>
> CPU times: user 667 ms, sys: 0 ns, total: 667 ms
> Wall time: 672 ms
> </pre>

Even though the second thread releases the GIL while running, it can't start until the first has
completed. Thus, the overall runtime is effectively the same as running two GIL-locked threads.

Finally, be aware that attempting to unlock the GIL from a thread that doesn't own it will crash the
**interpreter**, not just the thread attempting the unlock:

```python
%%cython

cdef int cython_recurse(int n) nogil:
    if n <= 0:
        return 0

    with nogil:
        return cython_recurse(n - 1)

cython_recurse(2)
```

> <pre>
> Fatal Python error: PyEval_SaveThread: NULL tstate
> 
> Thread 0x00007f499effd700 (most recent call first):
>   File "/home/bspeice/.virtualenvs/release-the-gil/lib/python3.7/site-packages/ipykernel/parentpoller.py", line 39 in run
>   File "/usr/lib/python3.7/threading.py", line 926 in _bootstrap_inner
>   File "/usr/lib/python3.7/threading.py", line 890 in _bootstrap
> </pre>

In practice, avoiding this issue is simple. First, `nogil` functions probably shouldn't contain
`with nogil` blocks. Second, Cython can
[conditionally acquire/release](https://cython.readthedocs.io/en/latest/src/userguide/external_C_code.html#conditional-acquiring-releasing-the-gil)
the GIL, so these conditions can be used to synchronize access. Finally, Cython's documentation for
[external C code](https://cython.readthedocs.io/en/latest/src/userguide/external_C_code.html#acquiring-and-releasing-the-gil)
contains more detail on how to safely manage the GIL.

To conclude: use Cython's `nogil` annotation to assert that functions are safe for calling when the
GIL is unlocked, and `with nogil` to actually unlock the GIL and run those functions.

# Numba

Like Cython, [Numba](https://numba.pydata.org/) is a "compiled Python." Where Cython works by
compiling a Python-like language to C/C++, Numba compiles Python bytecode _directly to machine code_
at runtime. Behavior is controlled with a special `@jit` decorator; calling a decorated function
first compiles it to machine code before running. Calling the function a second time re-uses that
machine code unless the argument types have changed.

Numba works best when a `nopython=True` argument is added to the `@jit` decorator; functions
compiled in [`nopython`](http://numba.pydata.org/numba-doc/latest/user/jit.html?#nopython) mode
avoid the CPython API and have performance comparable to C. Further, adding `nogil=True` to the
`@jit` decorator unlocks the GIL while that function is running. Note that `nogil` and `nopython`
are separate arguments; while it is necessary for code to be compiled in `nopython` mode in order to
release the lock, the GIL will remain locked if `nogil=False` (the default).

Let's repeat the same experiment, this time using Numba instead of Cython:

```python
# The `int` type annotation is only for humans and is ignored
# by Numba.
@jit(nopython=True, nogil=True)
def numba_nogil(n: int) -> int:
    if n <= 1:
        return n

    a = 0
    b = 1

    c = a + b
    for _i in range(2, n):
        a = b
        b = c
        c = a + b

    return c


# Run using `nopython` mode to receive a performance boost,
# but GIL remains locked due to `nogil=False` by default.
@jit(nopython=True)
def numba_gil(n: int) -> int:
    if n <= 1:
        return n

    a = 0
    b = 1

    c = a + b
    for _i in range(2, n):
        a = b
        b = c
        c = a + b

    return c


# Call each function once to force compilation; we don't want
# the timing statistics to include how long it takes to compile.
numba_nogil(N)
numba_gil(N);
```

We'll perform the same tests as above; first, figure out how long it takes the function to run:

```python
%%time
_ = numba_gil(N)
```

> <pre>
> CPU times: user 253 ms, sys: 258 µs, total: 253 ms
> Wall time: 251 ms
> </pre>

<span style="font-size: .8em">
Aside: it's not immediately clear why Numba takes ~20% less time to run than Cython for code that should be
effectively identical after compilation.
</span>

When running two GIL-locked threads, the result (as expected) takes around twice as long to compute:

```python
%%time
t1 = Thread(target=numba_gil, args=[N])
t2 = Thread(target=numba_gil, args=[N])
t1.start(); t2.start()
t1.join(); t2.join()
```

> <pre>
> CPU times: user 541 ms, sys: 3.96 ms, total: 545 ms
> Wall time: 541 ms
> </pre>

But if the GIL-unlocking thread starts first, both threads run in parallel:

```python
%%time
t1 = Thread(target=numba_nogil, args=[N])
t2 = Thread(target=numba_gil, args=[N])
t1.start(); t2.start()
t1.join(); t2.join()
```

> <pre>
> CPU times: user 551 ms, sys: 7.77 ms, total: 559 ms
> Wall time: 279 ms
> </pre>

Just like Cython, starting the GIL-locked thread first leads to poor performance:

```python
%%time
t1 = Thread(target=numba_gil, args=[N])
t2 = Thread(target=numba_nogil, args=[N])
t1.start(); t2.start()
t1.join(); t2.join()
```

> <pre>
> CPU times: user 524 ms, sys: 0 ns, total: 524 ms
> Wall time: 522 ms
> </pre>

Finally, unlike Cython, Numba will unlock the GIL if and only if it is currently acquired;
recursively calling `@jit(nogil=True)` functions is perfectly safe:

```python
from numba import jit

@jit(nopython=True, nogil=True)
def numba_recurse(n: int) -> int:
    if n <= 0:
        return 0

    return numba_recurse(n - 1)

numba_recurse(2);
```

# Conclusion

Before finishing, it's important to address pain points that will show up if these techniques are
used in a more realistic project:

First, code running in a GIL-free context will likely also need non-trivial data structures;
GIL-free functions aren't useful if they're constantly interacting with Python objects whose access
requires the GIL. Cython provides
[extension types](http://docs.cython.org/en/latest/src/tutorial/cdef_classes.html) and Numba
provides a [`@jitclass`](https://numba.pydata.org/numba-doc/dev/user/jitclass.html) decorator to
address this need.

Second, building and distributing applications that make use of Cython/Numba can be complicated.
Cython packages require running the compiler, (potentially) linking/packaging external dependencies,
and distributing a binary wheel. Numba is generally simpler because the code being distributed is
pure Python, but can be tricky since errors aren't detected until runtime.

Finally, while unlocking the GIL is often a solution in search of a problem, both Cython and Numba
provide tools to directly manage the GIL when appropriate. This enables true parallelism (not just
[concurrency](https://stackoverflow.com/a/1050257)) that is impossible in vanilla Python.
