---
layout: post
title: "Rust's primitives are Weird (and cool)"
description: "but mostly weird."
category: 
tags: [rust, c, java, python, x86]
---

I wrote a really small Rust program a while back that I was 100% convinced couldn't possibly run:

```rust
fn main() {
    println("{}", 8.to_string())
}
```

And to my complete befuddlement, it compiled, it ran, and it produced a completely sensible output.
The reason I was so surprised has to do with how Rust treats a special category of things
I'm going to call *primitives*. In the current version of the Rust book, you'll see them
referred to as [scalars](rust_scalar), and in older versions they'll be called [primitives](rust_primitive).
We're going to stick with the name *primitive* for the time being though because to explain
why this program is so cool requires talking about a number of other programming languages,
and keeping a consistent terminology makes things easier.

**You've been warned:** this is going to be a tedious post about a relatively minor issue that involves
a quick jaunt all the way through Java, Python, C, and x86 Assembly, but demonstrates a really cool
way that Rust thinks differently about the world.

But because I'm not a monster, here's someone else who's just as excited as you are to learn about
primitives:

![Excited dog](/assets/images/rust-primitives/excited.jpg)
> [Unreasonably excited doggo][excited_doggo]

# Defining primitives (Java)

My day job is in Java. I'm continually amazed by how much of the world runs on Java,
and somehow manages to continue functioning. Like, it can't be that good, because nothing
in Computer Science functions that well. And yet, Java is maybe one of the few things
CS people can high-five and say "you know what, we did a good thing."

But that's not what this post is about. In Java, there's a special name for
some specific types of values:

> ```
bool    char    byte
short   int     long
float   double
```

They are referred to as [primitives][java_primitive]. And relative to the other bits of Java,
they have two super-cool features. First, they don't have to worry about the
[billion-dollar mistake](https://en.wikipedia.org/wiki/Tony_Hoare#Apologies_and_retractions);
primitives in Java can never be `null`. Second: *they can't have instance methods*.
Remember that Rust program from earlier? Java has no idea what to do with it:

```java
class Main {
    public static void main(String[] args) {
        int x = 8;
        System.out.println(x.toString()); // Triggers a compiler error
    }
}
```

The error is:

```
Main.java:5: error: int cannot be dereferenced
        System.out.println(x.toString());
                            ^
1 error
```

The reason for this error is that only things inheriting from
[`Object`](https://docs.oracle.com/javase/9/docs/api/java/lang/Object.html)
can have instance methods, and the primitive types do not in fact inherit this.
If we really want, we can turn the `int` into an
[`Integer`](https://docs.oracle.com/javase/9/docs/api/java/lang/Integer.html) and then
turn that into a `String` and print it, but that seems like a lot of work:

```java
class Main {
    public static void main(String[] args) {
        int x = 8;
        Integer y = Integer.valueOf(x);
        System.out.println(y.toString());
    }
}
```

This allows us to create the variable `y` of type `Integer`, and at run time peek into `y`
to locate the `toString()` function and call it.

So why do we have to jump through the extra hoops for this? The reason is partially that Java
treats the primitive values as just a "bag of bits"; there are no functions to call, no references
to maintain, it's just a set number of bits to represent a value. If you call a function using
`int` or `long` as an argument, internally Java will copy the bits across and your original value
can't be modified.

And if Rust has a similar "bag of bits" representation for its primitives (spoiler alert: it does),
that gives us our first question: how does Rust get away with calling the equivalent of instance methods?

# Low Level Handling of Primitives (C)

Now, I still want to show off the "bag of bits" representation of primitives in Rust. But to do that,
we have to expose a bit of how your computer thinks about those values. Let's consider the following
code in C:

```c
void my_function(int num) {}

int main() {
    int x = 8;
    my_function(x);
}
```

And to drive the point home (and pretend like I understand assembly), let's take a look at the result
using the [compiler explorer](https://godbolt.org/z/lgNYcc): <span style="font-size:.6em">whose output has been lightly edited</span>

```
main:
        push    rbp
        mov     rbp, rsp
        sub     rsp, 16
        ; We assign the value `8` to `x` here
        mov     DWORD PTR [rbp-4], 8
        ; And copy the bits making up `x` to a location
        ; `my_function` can access
        mov     eax, DWORD PTR [rbp-4]
        mov     edi, eax
        call    my_function
        mov     eax, 0
        leave
        ret

my_function:
        push    rbp
        mov     rbp, rsp
        ; Copy the bits out of the pre-determined location
        ; to somewhere we can use
        mov     DWORD PTR [rbp-4], edi
        nop
        pop     rbp
        ret
```

At a really low level of memory, we're copying bits around; nothing crazy. That's what the `mov` instruction
is intended to do (use [this][x86_guide] as a reference). But to show how similar Rust is, let's take a look at the equivalent
Rust code in the [compiler explorer](https://godbolt.org/z/cAlmk0): <span style="font-size:.6em">again, lightly edited</span>

```rust
fn my_function(x: i32) {}

fn main() {
    let x = 8;
    my_function(x)
}
```

```
example::main:
  push rax
  ; Look familiar? We're copying bits to a location for `my_function`
  ; The compiler just optimizes out holding `x` in memory
  mov edi, 8
  call example::my_function
  pop rax
  ret

example::my_function:
  sub rsp, 4
  ; And copying those bits again, just like in C
  mov dword ptr [rsp], edi
  add rsp, 4
  ret
```

The generated Rust looks almost identical to C, and is the same as how Java thinks of primitives: just bits in memory.

And now that we're a bit more familiar with the low-level representation of primitives, it's time to answer:
how exactly does Rust manage to compile `8.to_string()`?

# impl primitive (and Python)

Now it's time to reveal my <strike>trap card</strike> <strike>dirty secret</strike> revelation: *Rust has
implementations for its primitive types.* That's right, `impl` blocks aren't only for `structs` and `traits`,
primitives get them too. Don't believe me? Check out [u32](https://doc.rust-lang.org/std/primitive.u32.html),
[f64](https://doc.rust-lang.org/std/primitive.f64.html) and [char](https://doc.rust-lang.org/std/primitive.char.html)
as examples.

But the really interesting bit is how Rust turns the code we started with into assembly. Let's break out the
[compiler explorer](https://godbolt.org/z/6LBEwq) once again:

```rust
pub fn main() {
    8.to_string()
}
```

And the interesting bits in the assembly:

```
example::main:
  sub rsp, 24
  mov rdi, rsp
  lea rax, [rip + .Lbyte_str.u]
  mov rsi, rax
  ; Bombshell right here
  call <T as alloc::string::ToString>::to_string@PLT
  mov rdi, rsp
  call core::ptr::drop_in_place
  add rsp, 24
  ret
```

Now, this assembly is far more complicated, but here's the big revelation: **we're calling
`to_string()` as a function that isn't bound to the instance of `8`**. Instead of thinking
of the value 8 as an instance of `u32` and then peeking in to find the location of the function
we want to call, we have a function that exists outside of the instance and just give
that function the value `8`.

This is an incredibly technical detail, but the interesting idea I had was this:
*if `to_string()` is a static function, can I refer to the unbound function and give
it an instance?*

Better explained in code (and a [compiler explorer](https://godbolt.org/z/fJY-gA) link
because I seriously love this thing):

```rust
struct MyVal {
    x: u32
}

impl MyVal {
    fn to_string(&self) -> String {
        self.x.to_string()
    }
}

pub fn main() {
    let my_val = MyVal { x: 8 };

    // THESE ARE THE SAME
    my_val.to_string();
    MyVal::to_string(&my_val);
}
```

Rust is totally fine "binding" the function call to the instance, and also as a static.

MIND == BLOWN.

Python does something equivalent where I can both call functions bound to their instances
and also call as an unbound function where I give it the instance:

```python
class MyClass():
    x = 24

    def my_function(self):
        print(self.x)

m = MyClass()

m.my_function()
MyClass.my_function(m)
```

That said, Python still doesn't treat "primitives" as things that can have instance methods:

```
>>> dir(8)
['__abs__', '__add__', '__and__', '__class__', '__cmp__', '__coerce__',
'__delattr__', '__div__', '__divmod__', '__doc__', '__float__', '__floordiv__',
...
'__setattr__', '__sizeof__', '__str__', '__sub__', '__subclasshook__', '__truediv__',
...]

>>> # Theoretically `8.__str__()` should exist, but:

>>> 8.__str__()
  File "<stdin>", line 1
    8.__str__()
             ^
SyntaxError: invalid syntax
```

So while Python handles binding instance methods in a way similar to Rust, it's still not able
to run the example we started with.

# Conclusion

This was a super-roundabout way of demonstrating it, but the way Rust handles incredibly minor details
like primitives is one of the reasons I enjoy the language. It's optimized like C in how it lays out
memory and is efficient ("bag of bits" representation). And it still has a lot of
the nice features I like in Python that make it easy to work with the language (late/static binding).

And even given that, there are still areas where Rust shines that none of the other languages discussed do;
as a kinda quirky feature of Rust's type system, `8.to_string()` is actually valid code.

There aren't too many grand lessons to be learned from this, the behavior I'm talking about is
a relatively minor detail in the grand picture. But it's still something I learned where Rust
just gets the details right, and I love it.

[x86_guide]: http://www.cs.virginia.edu/~evans/cs216/guides/x86.html
[excited_doggo]: https://flic.kr/p/2jr8Zp
[java_primitive]: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html
[compiler_explorer]: https://godbolt.org/
[rust_scalar]: https://doc.rust-lang.org/book/second-edition/ch03-02-data-types.html#scalar-types
[rust_primitive]: https://doc.rust-lang.org/book/first-edition/primitive-types.html