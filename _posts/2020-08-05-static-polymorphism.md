---
layout: post
title: "Static Polymorphism"
description: "Emulating Traits in C++"
category:
tags: [python]
---

# Simple Example

Accept parameter types, return known type.

# Generic return

Same parameter signature, but return different types - `AsRef`

# Associated types

`.as_iter()`, and the iterator item types

# Arbitrary `self`

[`std::enable_shared_from_this`](https://en.cppreference.com/w/cpp/memory/enable_shared_from_this)

`enable_unique_from_this` doesn't make a whole lot of sense, but Rust can do it:

```rust
struct MyStruct {}

impl MyStruct {
    fn my_function(self: &Box<Self>) {}
}

fn main() {
    let unboxed = MyStruct {};
    // error[E0599]: no method named `my_function` found for struct `MyStruct` in the current scope
    // unboxed.my_function();

    let boxed = Box::new(MyStruct {});
    boxed.my_function();
    boxed.my_function();
}
```

Interestingly enough, can't bind `static` version using equality:

```c++
#include <iterator>
#include <vector>
#include <concepts>

std::uint64_t free_get_value() {
    return 24;
}

class MyClass {
public:
    // <source>:11:47: error: invalid pure specifier (only '= 0' is allowed) before ';' token
    std::uint64_t get_value() = free_get_value;
};

int main() {
    auto x = MyClass {};
}
```

---

Turns out the purpose of `enable_shared_from_this` is so that you can create new shared instances of
yourself from within yourself, it doesn't have anything to do with enabling extra functionality
depending on whether you're owned by a shared pointer. _At best_, you could have other runtime
checks to see if you're owned exclusively, or as part of some other smart pointer, but the type
system can't enforce that. And if you're _not_ owned by that smart pointer, what then? Exceptions?

UFCS would be able to help with this - define new methods like:

```c++
template<>
void do_a_thing(std::unique_ptr<MyType> value) {}
```

In this case, the extension is actually on `unique_ptr`, but the overload resolution applies only to
pointers of `MyType`. Note that `shared_ptr` and others seem to work by overloading `operator ->` to
proxy function calls to the delegates; you could inherit `std::shared_ptr` and specialize the
template to add methods for specific classes I guess? But it's still inheriting `shared_ptr`, you
can't define things directly on it.

Generally, "you can just use free functions" seems like a shoddy explanation. We could standardize
overload `MyClass_init` as a constructor and function similar to C, etc., but the language is
designed to assist us so we don't have to do crap like that. I do hope UFCS becomes a thing.

That said, it is interesting that for Rust, arbitrary self can be replaced with traits:

```rust
trait MyTrait {
    fn my_function(&self);
}

impl MyTrait for Box<MyStruct> {
    fn my_function(&self) {}
}
```

Just have to make sure that `MyTrait` is in scope all the time, and that's not fun. Ultimately, Rust
kinda already has UFCS.

# Default implementation

First: example of same name, different arguments. Not possible in Rust.

Can you bind a free function in a non-static way? Pseudocode:

```c++
template<typename T>
concept DoMethod = requires (T a) {
    { a.do_method(std::declval<std::uint64_t>() } -> std::same_as<std::uint64_t>;
    { a.do_method() } -> std::same_as<std::uint64_t>;
}

template<typename T> requires DoMethod<T>
std::uint64_t free_do_method(T& a) {
    a.do_method(0);
}

class MyClass {
public:
    std::uint64_t do_method(std::uint64_t value) {
        return value * 2;
    }

    // Because the free function still needs a "this" reference (unlike Javascript which has a
    // floating `this`), we can't bind as `std::uint64_t do_method() = free_do_method`
    // Also can't do it because it's a syntax error; can only use `= 0` to indicate pure virtual.
    std::uint64_t do_method() {
        return free_do_method(this);
    }
};
```

# Require concept methods to take `const this`?

`std::is_const` should be able to handle it: https://en.cppreference.com/w/cpp/types/is_const

# Move/consume `self` as opposed to `&self`?

Is there a way to force `std::move(object).method()`? C++ can still use objects after movement makes
them invalid, so not sure that it makes conceptual sense.

# Require static methods on a class?

Shouldn't be too hard - `T::some_method()` should be compilable.

# `override`, or other means of verifying a function implements a requirement?

`noexcept`, etc.

# Local trait implementation of remote types?

AKA "extension methods". UFCS can accomplish this, and could use free functions to handle instead,
but having the IDE auto-complete `.<the next thing>` is exceedingly useful, as opposed to memorizing
what functions are necessary for conversion. We're not changing what's possible, just making it
easier for humans.

Likely requires sub-classing the remote class. Implicit conversions don't _really_ work because they
must be defined on the remote type.

Rust makes this weird because you have to `use ClientExt` to bring the methods in scope, but the
trait name might not show up because `impl ClientExt for RemoteStruct` is defined elsewhere.
Alternately, `ClientExt: AnotherTrait` implementations where the default `ClientExt` implementation
is used. To do this, Rust compiles the entire crate as a single translation unit, and the orphan
rule.

# Automatic markers?

Alternately, conditional inheritance based on templates?

# Trait objects as arguments

```rust
trait MyTrait {
    fn some_method(&self);
}

fn my_function(value: &dyn MyTrait) {

}
```

C++ can't explicitly use vtable as part of concepts:

```c++
template<typename T, typename = std::enable_if_t<...>>
void my_function(T& value) {}
```

...is equivalent to:

```rust
fn my_function<T: MyTrait>(value: &T) {}
```

Alternate form with concepts:

```c++
#include <concepts>
#include <cstdint>

template<typename T>
concept HasMethod = requires (T a) {
    { a.some_method() } -> std::same_as<std::uint64_t>;
};

auto my_function(HasMethod auto value) {
    auto x = value.some_method();
}

class MyClass {
public:
    std::uint64_t some_method() {
        return 42;
    }
};

int main() {
    auto x = MyClass {};
    my_function(x);
}
```

vtable is automatically used if virtual, but concepts (so far as I can tell) can't detect virtual.

`dyn Trait` seems to be used in Rust mostly for type erasure - `Box<Pin<dyn Future>>` for example,
but is generally fairly rare, and C++ probably doesn't suffer for not having it. Can use inheritance
to force virtual if truly necessary, but not sure why you'd need that.
