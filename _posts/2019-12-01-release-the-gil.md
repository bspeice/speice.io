---
layout: post
title: "Release the GIL"
description: "Strategies for Parallelism in Python"
category: 
tags: [python]
---

Complaining about the [Global Interpreter Lock](https://wiki.python.org/moin/GlobalInterpreterLock) seems like a rite of passage for Python developers. It's easy to make fun of a design decision made before multi-core CPU's were widely available, but the fact that it's still around indicates that it generally works [Good](https://wiki.c2.com/?PrematureOptimization) [Enough](https://wiki.c2.com/?YouArentGonnaNeedIt). Besides, it's not hard to start a [new process](https://docs.python.org/3/library/multiprocessing.html) and use message passing to synchronize if there's a need to run things in parallel.

Still, one often wonders what could be possible if only the GIL wasn't holding them back. The thought of having only a single active interpreter thread seems so old-fashioned in an era where NodeJS and Go allow scheduling $M$ coroutines to $N$ system threads. Why can't Python learn to break free?

Presented below are some strategies for releasing the GIL's icy grip. Bear in mind that these are just the tools, and no claim is made about whether it's a good idea to use them. Very often, unlocking the GIL is an [XY problem](https://en.wikipedia.org/wiki/XY_problem); you want application performance, and the GIL seems like an obvious bottleneck. Just remember that you're *intentionally* breaking Python's memory model.


```python
%load_ext Cython
from numba import jit

N = 1_000_000_000
```

# Cython

Put simply, [Cython](https://cython.org/) is a programming language that looks a lot like Python, gets translated to C or C++ before compiling, and integrates well with the [CPython](https://en.wikipedia.org/wiki/CPython) API. It's great for building Python wrappers to C and C++ libraries, writing optimized code for numerical processing, and a bunch of other things. As Coffeescript is to Javascript, so is Cython to C. 

When it comes to managing the GIL, there are two utilities to keep in mind:

- The `nogil` [function annotation](https://cython.readthedocs.io/en/latest/src/userguide/external_C_code.html#declaring-a-function-as-callable-without-the-gil) marks a function as safe to use without the GIL
- The `with nogil` [context manager](https://cython.readthedocs.io/en/latest/src/userguide/external_C_code.html#releasing-the-gil) explicitly unlocks the CPython GIL while in that block

Whenever Cython code runs inside a `with nogil` block, the Python interpreter is unblocked and allowed to continue work elsewhere. We'll calculate the Fibonacci sequence to demonstrate this principle in action:


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
    # Explicitly release the GIL before calling `fibonacci`
    with nogil:
        value = fibonacci(n)

    return value


def cython_gil(unsigned long n):
    # Because the GIL is not explicitly released, it implicitly
    # remains acquired.
    return fibonacci(n)
```

First, let's time how long it takes Cython to calculate the billionth Fibonacci number:


```python
%%time
_ = cython_gil(N);
```

> <pre>
> CPU times: user 365 ms, sys: 0 ns, total: 365 ms
> 
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


Both versions (with and without GIL) take effectively the same amount of time to run. If we run them in parallel without unlocking the GIL, *even though two threads are used*, we expect the time to double (only one thread can be active at a time):


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


However, one thread releasing the GIL means that the second thread is free to acquire the GIL and perform its processing in parallel:


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


Keep in mind that **the order in which threads are started matters**!


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


Even though the second thread releases the GIL lock, it can't start until the first has completed. Thus, the overall runtime the same as running two GIL-locked threads.

Finally, be aware that attempting to unlock the GIL from a thread that doesn't own it will crash the **interpreter**, not just the thread attempting the unlock:

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

In practice, it's not difficult to avoid this ussue. While `nogil` functions likely shouldn't contain `with nogil` blocks GIL themselves, Cython can [conditionally acquire/release the GIL](https://cython.readthedocs.io/en/latest/src/userguide/external_C_code.html#conditional-acquiring-releasing-the-gil). Cython's documentation for [external C code](https://cython.readthedocs.io/en/latest/src/userguide/external_C_code.html#acquiring-and-releasing-the-gil) contains plenty of information on how to safely manage the GIL.

To conclude: use Cython's `nogil` annotation to mark functions as safe for calling when the GIL is unlocked, and `with nogil` to actually unlock the GIL. Because Cython refuses to compile functions declared `nogil` if they interact with the CPython API, it is difficult to trigger safety issues at runtime.

# Numba

Like Cython, [Numba](https://numba.pydata.org/) is also a "compiled Python." Where Cython works by compiling a Python-like language to C/C++, Numba compiles Python bytecode *directly to machine code* at runtime. Behavior is controlled using a special `@jit` decorator; calling a decorated function first compiles it to machine code, and then runs it. Calling the function a second time triggers recompilation only if the argument types change.

Numba works best when a `nopython=True` argument is added to the `@jit` decorator; functions compiled in [`nopython`](http://numba.pydata.org/numba-doc/latest/user/jit.html?#nopython) mode ignore the CPython API and have performance comparable to C. Additionally, we can unlock the GIL by adding `nogil=True` to the `@jit` decorator. Note that `nogil` and `nopython` are different arguments; while it is necessary for code to be compiled in `nopython` mode in order to release the GIL, the GIL will remain locked if `nogil=False` (the default).

Let's repeat the same Fibonacci experiment, this time using Numba instead of Cython:

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


# We implement the algorithm multiple times because the GIL is unlocked
# whenver we enter a function with `nogil=True`, and we want to keep the
# GIL locked during this function's execution.
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

We'll perform the same tests as Cython; first, figure out how long it takes to run:

```python
%%time
_ = numba_gil(N)
```

> <pre>
> CPU times: user 253 ms, sys: 258 µs, total: 253 ms
> Wall time: 251 ms
> </pre>


<span style="font-size: .8em">
Aside: it's not clear why Numba takes ~20% less time to produce the same result as Cython.
Local tests I've run show that nopython mode doesn't affect runtime in this example.
</span>

When running two GIL-locked threads in parallel, the result (as expected) takes around twice as long to compute:

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


And when the GIL-unlocking thread runs first, we can run threads in parallel:


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


Just like Cython, starting a GIL-locked thread first leads to overall runtime taking twice as long:


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


Finally, unlike Cython, Numba will unlock the GIL if and only if it is currently acquired; recursively calling `@jit(nogil=True)` functions is perfectly safe:


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

While unlocking the GIL is often a solution in search of a problem, both Cython and Numba provide means to unlock the GIL when applicable. This enables true parallelism (not just [concurrency](https://stackoverflow.com/a/1050257)) that is impossible in vanilla Python.

Before finishing, it's important to address pain points that will show up if these techniques are used in a more realistic project:

First, code running in a GIL-free context will likely also need non-trivial data structures; GIL-free functions aren't useful if they're constantly interacting with Python objects. Cython provides [extension types](http://docs.cython.org/en/latest/src/tutorial/cdef_classes.html) to address this, and Numba provides the [`@jitclass`](https://numba.pydata.org/numba-doc/dev/user/jitclass.html) decorator to address this need.

Second, building and distributing applications that make use of Cython/Numba can be complicated. Cython requires running the compiler, linking with external dependencies, and distributing a binary wheel. Numba is generally simpler because code is distributed as-is and compiled just-in-time, but errors aren't detected until runtime and debugging can be problematic.
