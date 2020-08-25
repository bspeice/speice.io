---
layout: post
title: "Static Polymorphism"
description: "Emulating Traits in C++"
category:
tags: [python]
---

Other languages have done similar things (interfaces in Java), but think the Rust comparison is
useful because both languages are "system." Mostly looking at how static polymorphism is implemented
in C++ and Rust, but also some comparisons to Rust behavior not strictly related to polymorphism.

# Simple Example

Accept parameter types, return known type. Also needs to be generic over parameter types.

# Generic return

Same name and parameter signature, but return different types - `AsRef`

# Associated types

`.as_iter()`, and the iterator `Item` type

# Require static methods on a class?

Shouldn't be too hard - `T::some_method()` should be compilable.

# Arbitrary `self`

Forms the basis for Rust's async system, but used very rarely aside from that.

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
kinda already has UFCS. It's only "kinda" because you have to bring it in scope, and it's
potentially unclear when it's being used (extension traits), but it does get the basic job done.

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

Not exactly polymorphism, but is a significant feature of Rust trait system. Is there a way to force
`std::move(object).method()`? C++ can still use objects after movement makes them invalid, so not
sure that it makes conceptual sense - it's your job to prevent use-after-move, not the compiler's.

# Local trait implementation of remote data type?

AKA "extension methods". UFCS can accomplish this, and could use free functions to handle instead,
but having the IDE auto-complete `.<the next thing>` is exceedingly useful, as opposed to memorizing
what functions are necessary for conversion. We're not changing what's possible, just making it
easier for humans.

Likely requires sub-classing the remote class. Implicit conversions don't _really_ work because they
must be defined on the remote type (not true: `operator Local` must be defined on remote, but
`Local` could have a `Local(const Remote&)` implicit constructor). Could maybe use wrapper classes
that have single-arg (implicit) constructors, and get away with it as long as the wrapper knows it's
not safe to modify the internals. That said, wrapper can only use the public interface unless
declared friend (which is no different to Rust).

```c++
#include <concepts>
#include <cstdint>

class SomeRemoteClass {};

template<typename T>
concept MyConcept = requires (T a) {
    { a.do_something() } -> std::same_as<std::uint64_t>;
};

// Note: It's unsafe to move `SomeRemoteClass`, so we accept by reference
// Requiring SomeRemoteClass be copy-constructible would also be OK.
class LocalImpl {
public:
    LocalImpl(const SomeRemoteClass &remote): remote_{remote} {};
    std::uint64_t do_something() {
        return 42;
    }

private:
    const SomeRemoteClass &remote_;
};

auto auto_func(MyConcept auto value) {
    auto x = value.do_something();
}

void regular_func(LocalImpl value) {
    auto x = value.do_something();
}

int main() {
    SomeRemoteClass x {};

    // This isn't OK because `auto` doesn't automatically convert to `LocalImpl`
    //auto_func(x);

    // This _is_ OK because we explicitly declare the class we want (`LocalImpl`) and `SomeRemoteClass`
    // is implicitly converted. Just so happens that `LocalImpl` implements `MyConcept`.
    regular_func(x);

    // We could extend the conversion pattern using specializations of `LocalImpl`, or maybe use
    // `std::variant` to hold different internal types, but there's still a disconnect between
    // what we actually want to fulfill (`MyConcept`) and how that's implemented for remote types
    // (using the `LocalImpl` wrapper and implicit conversions).
}
```

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

Kind of nice because you don't have to explicitly manage the vtable in Rust, but you trade off the
ability to get inheritance. Modern trends have been "composition over inheritance" (see Google style
docs as an example) so the trend may be worth it, but moving away from inheritance models is
disorienting.

`dyn Trait` seems to be used in Rust mostly for type erasure - `Box<Pin<dyn Future>>` for example,
but is generally fairly rare, and C++ probably doesn't suffer for not having it. Can use inheritance
to force virtual if truly necessary, but not sure why you'd need that.

# Checking a type fulfills the concept

With concepts, you find out that there's an issue only when you attempt to use it. Traits in Rust
will let you know during implementation that something is wrong (there's a local error).  
https://www.ecorax.net/as-above-so-below-1/

Can use `static_assert` to kinda make sure a contract is fulfilled:

```c++
#include <cstdint>
#include <type_traits>

template<typename T>
constexpr bool has_method = std::is_same_v<decltype(std::declval<T>().method()), std::uint64_t>;

class WithMethod {
public:
    std::uint64_t method() { return 0; }
};

static_assert(has_method<WithMethod>);

class WithoutMethod {};

// <source>: In instantiation of 'constexpr const bool has_method<WithoutMethod>':
// <source>:16:16:   required from here
// <source>:5:71: error: 'class WithoutMethod' has no member named 'method'
//     5 | constexpr bool has_method = std::is_same_v<decltype(std::declval<T>().method()), std::uint64_t>;
//       |                                                     ~~~~~~~~~~~~~~~~~~^~~~~~
// <source>:16:15: error: non-constant condition for static assertion
//    16 | static_assert(has_method<WithoutMethod>);
//       |
static_assert(has_method<WithoutMethod>);
```

We'd rather the example fail the static assert, rather than have an error on the `decltype`, but it
does get the job done; we're told explicitly that `WithoutMethod` has no member `method`, so the
error message for `decltype()` is actually much nicer than the `static_assert`.. Can use
[custom SFINAE](https://stackoverflow.com/a/257382) or
[experimental](https://stackoverflow.com/a/22014784)
[type traits](http://en.cppreference.com/w/cpp/experimental/is_detected) to fix those issues, but
mostly please just use concepts.

# Visibility

Worth acknowledging that C++ can do interesting things with `protected`, `friend`, and others, that
Rust can't. However, Rust can limit trait implementations to current crate ("sealed traits"), where
C++ concepts are purely duck typing.
