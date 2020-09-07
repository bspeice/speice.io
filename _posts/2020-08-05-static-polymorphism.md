---
layout: post
title: "Static Polymorphism"
description: "Emulating Traits in C++"
category:
tags: [python]
---

Other languages have done similar things (interfaces in Java), but think the Rust comparison is
useful because both languages are "system."

# System Differences

Worth noting differences in goals: polymorphism in C++ is only duck typing. Means that static
polymorphism happens separate from visibility, overloading, etc.

Rust's trait system is more thorough (need a better way to explain that), which allows for trait
markers, auto-deriving, arbitrary self.

# Simple Example

Accept parameter types, return known type. Also needs to be generic over parameter types.

Should make a quick note that C++ doesn't allow

# Generic return

Same name and parameter signature, but return different types - `AsRef`

# Associated types

`.as_iter()`, and the iterator `Item` type

# decltype and compiler-named types

Rust has some types named by the compiler, but inaccessible in traits; can't return `impl SomeTrait`
from traits. Can return `impl Future` from free functions and structs, but traits can't use
compiler-generated types (associated types still need to name the type).

Can have traits return references (`&dyn Trait`), but uses vtable (so no longer statically
polymorphic), and very likely get into all sorts of lifetime issues. Can use `Box<dyn Trait>` trait
objects to avoid lifetime issues, but again, uses vtable.

C++ doesn't appear to have the same restrictions, mostly because the "contract" is just duck typing.

# Require static methods on a class?

Shouldn't be too hard - `T::some_method()` should be compilable.

# Default implementation

First: example of same name, different arguments. Not possible in Rust.

```rust
trait MyTrait {
    // This is illegal in Rust, even though name-mangling is unique:
    // fn method(&self, value: usize) -> usize;

    // Works if you rename the method, but is a pain to type:
    fn method_with_options(&self, value: usize) -> usize;
    fn method(&self) -> usize {
        self.method_with_options(42);
    }
}

struct MyStruct {}
impl MyTrait for MyStruct {
    fn method_with_options(&self, value: usize) -> usize {
        println!("{}", value);
        value
    }
}
```

Second: example of same name, different arguments, but can't provide default implementation.

```c++
template <typename T>
concept MyTrait = requires (T a) {
    { a.method(declval<std::size_t>()) } -> std::same_as<std::size_t>,
    { a.method() } -> std::same_as<std::size_t>,
}

// Each class must implement both `method` signatures.
class MyClass {
public:
    std::size_t method(std::size_t value) {
        std::cout << value << std::endl;
        return value;
    }

    std::size_t method() {
        return method(42);
    }
};

// Can write free functions as the default and then call explicitly, but for trivial
// implementations (replacing defaults) it's not likely to be worth it.
auto method_default_(auto MyTrait this) std::size_t {
    return this.method(42);
}

class MyClassDefault {
public:
    std::size_t method(std::size_t value) {
        std::cout << value << std::endl;
        return value;
    }

    std::size_t method() {
        return method_default_(this);
    }
}
```

# Method Qualifiers

Rust allows declaring immutable or mutable.

Can require object we're calling methods on to be `const`:

```c++
#include <concepts>
#include <cstdint>

template <typename T>
concept ConstMethod = requires (const T a) {
    { a.method() } -> std::same_as<std::uint64_t>;
};

std::uint64_t my_function(ConstMethod auto a) {
    return a.method();
}

class HasConst {
public:
    std::uint64_t method() const {
        return 42;
    }
};

class WithoutConst {
public:
    std::uint64_t method() {
        return 42;
    }
};

int main() {
    auto x = HasConst{};
    my_function(x);

    auto y = WithoutConst{};
    my_function(y);
}
```

```text
<source>:32:18: error: use of function 'uint64_t my_function(auto:1) [with auto:1 = WithoutConst; uint64_t = long unsigned int]' with unsatisfied constraints
   32 |     my_function(y);
      |                  ^
<source>:9:15: note: declared here
    9 | std::uint64_t my_function(ConstMethod auto a) {
      |               ^~~~~~~~~~~
<source>:9:15: note: constraints not satisfied
<source>: In instantiation of 'uint64_t my_function(auto:1) [with auto:1 = WithoutConst; uint64_t = long unsigned int]':
<source>:32:18:   required from here
<source>:5:9:   required for the satisfaction of 'ConstMethod<auto:1>' [with auto:1 = WithoutConst]
<source>:5:23:   in requirements with 'T a' [with T = WithoutConst]
<source>:6:37: note: the required expression 'const_cast<const T&>(a).method()' is invalid, because
    6 |     { const_cast<const T&>(a).method() } -> std::same_as<std::uint64_t>;
      |       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^~
<source>:6:37: error: passing 'const WithoutConst' as 'this' argument discards qualifiers [-fpermissive]
<source>:22:19: note:   in call to 'uint64_t WithoutConst::method()'
   22 |     std::uint64_t method() {
      |                   ^~~~~~
```

...which is equivalent to Rust's `&mut self`. Unlike Rust, can't mark `this` as consumed.

Alternate form: using `static_cast<>` allows mixing some methods that are `const`, some not:

```c++
#include <concepts>
#include <cstdint>

template <typename T>
concept ConstMethod = requires (T a) {
    { static_cast<const T>(a).const_method() } -> std::same_as<std::uint64_t>;
    { a.nonconst_method() } -> std::same_as<std::uint64_t>;
    { a.unnecessary_const_method() } -> std::same_as<std::uint64_t>;
};

std::uint64_t my_function(ConstMethod auto a) {
    return a.method();
}

class HasConst {
public:
    std::uint64_t const_method() const {
        return 42;
    }

    std::uint64_t nonconst_method() {
        return 42;
    }

    // Concept didn't require this to be `const`, but we can add the qualifier if we want.
    std::uint64_t unnecessary_const_method() const {
        return 42;
    }
};

void f(ConstMethod auto x) {}

int main() {
    auto x = HasConst{};
    f(x);
}
```

Alternate alternate form:

```c++
template <typename T>
concept ConstMethod =
    requires (const T a) {
        { a.const_method() } -> std::same_as<std::uint64_t>;
    } &&
    requires (T a) {
        { a.nonconst_method() } -> std::same_as<std::uint64_t>;
        { a.unnecessary_const_method() } -> std::same_as<std::uint64_t>;
    };

// Can also use parentheses:
/*
template <typename T>
concept ConstMethod = (
    requires (const T a) {
        { a.const_method() } -> std::same_as<std::uint64_t>;
    } &&
    requires (T a) {
        { a.nonconst_method() } -> std::same_as<std::uint64_t>;
        { a.unnecessary_const_method() } -> std::same_as<std::uint64_t>;
    }
);
*/

// Formulated inside a `requires` block:
/*
template <typename T>
concept ConstMethod = requires {
    requires requires (const T a) {
        { a.const_method() } -> std::same_as<std::uint64_t>;
    };

    requires requires (T a) {
        { a.nonconst_method() } -> std::same_as<std::uint64_t>;
        { a.unnecessary_const_method() } -> std::same_as<std::uint64_t>;
    };
};
*/
```

Third alternate form:

```c++
template<typename T>
concept ConstMethods = requires (const T a) {
    { a.const_method() } -> std::same_as<std::uint64_t>;
};

template<typename T>
concept NonConstMethods = requires (T a) {
    { a.nonconst_method() } -> std::same_as<std::uint64_t>;
    { a.unnecessary_const_method() } -> std::same_as<std::uint64_t>;
};

template<typename T>
concept ConstMethod = ConstMethods<T> && NonConstMethods<T>;

// Formulated inside a requires block:
/*
template <typename T>
concept ConstMethod = requires {
    requires ConstMethods<T>;
    requires NonConstMethods<T>;
};
*/
```

...which goes a long way towards explaining why the "requires requires" form is necessary. Not sure
what the "best practices" form is, just trying to demonstrate what is possible.

Working with `const` parameters can be a bit weird because of implicit copies:

```c++
#include <concepts>
#include <cstdint>

class WithCopyCtor {
public:
    WithCopyCtor(const WithCopyCtor &other) = default;
};

class WithoutCopyCtor {
public:
    WithoutCopyCtor(const WithoutCopyCtor &other) = delete;
};

template <typename T>
concept ConstArgument = requires (T a) {
    // Arguments passed by value:
    { a.method_one(std::declval<const std::uint64_t>()) } -> std::same_as<std::uint64_t>;
    { a.method_two(std::declval<const WithCopyCtor>()) } -> std::same_as<std::uint64_t>;

    // Arguments passed by reference:
    { a.method_three(std::declval<const WithCopyCtor&>()) } -> std::same_as<std::uint64_t>;
    { a.method_four(std::declval<const WithoutCopyCtor&&>()) } -> std::same_as<std::uint64_t>;

    // NOTE: This requirement is illogical. It's impossible to call a method accepting a parameter
    // by value when that parameter can not copy construct.
    // Not sure if it's worth including this note in the final write-up though.
    //{ a.method_four(std::declval<const WithoutCopyCtor>()) } -> std::same_as<std::uint64_t>;

    { a.method_five(std::declval<WithoutCopyCtor&>()) } -> std::same_as<std::uint64_t>;
};

std::uint64_t my_function(ConstArgument auto a) {
    return 42;
}

class MyClass {
public:
    // NOTE: Even though the concept required `method_one` to accept `const std::uint64_t`, we don't need
    // to use a `const` qualifier here because we can implicitly copy `const std::uint64_t` to `std::uint64_t`.
    std::uint64_t method_one(std::uint64_t value) {
        return 42;
    }

    // NOTE: Similar to `method_one`, even though the concept declared `const WithCopyCtor`,
    // we can use the copy constructor to implicitly copy and convert between `const` and non-`const`.
    std::uint64_t method_two(WithCopyCtor value) {
        return 42;
    }

    // NOTE: Because we can't implicitly copy from `const` references to non-`const` references,
    // _even if the class has a copy constructor_, we must include the qualifier here.
    std::uint64_t method_three(const WithCopyCtor &value) {
        return 42;
    }

    // NOTE: Similar to `method_three`, because we can't copy from `const` rvalue references to non-`const`,
    // we must include the qualifier.
    std::uint64_t method_four(const WithoutCopyCtor &&value) {
        return 42;
    }

    // NOTE: We can _add_ a `const` qualifier even if the concept doesn't require it, because it's safe to
    // treat non-`const` references as `const.
    std::uint64_t method_five(const WithoutCopyCtor &value) {
        return 42;
    }
};

int main() {
    auto x = MyClass{};
    my_function(x);
}
```

Rust is much simpler about all this - the signature for a trait implementation must _exactly_ match
a trait definition. Actual usage rules may be weird (what happens with a mut reference
`#[derive(Copy)]` struct when a function takes immutable by value?), but the polymorphic side stays
consistent.

Can also use `noexcept` qualifier. Not sure why this has issues:

```c++
#include <concepts>
#include <cstdint>

template<typename T>
concept NoExceptMethod = requires (T a) {
    { noexcept(a.method()) } -> std::same_as<std::uint64_t>;
};

class NoExcept {
public:
    std::uint64_t method() {
        return 42;
    }
};

void f(NoExceptMethod auto a) {}

int main() {
    NoExcept x{};

    f(x);
}
```

Or why this is allowable:

```c++
#include <concepts>
#include <cstdint>

template<typename T>
concept NoExceptMethod = requires (T a) {
    { a.method() } -> std::same_as<std::uint64_t>;
    noexcept(a.method());
};

class NoExcept {
public:
    std::uint64_t method() {
        return 42;
    }
};

void f(NoExceptMethod auto a) {}

int main() {
    NoExcept x{};

    f(x);
}
```

Turns out this is the way to do it:

```c++
#include <concepts>
#include <cstdint>

template<typename T>
concept NoExceptMethod = requires (T a) {
    { a.method() } noexcept -> std::same_as<std::uint64_t>;
};

class NoExcept {
public:
    std::uint64_t method() noexcept {
        return 42;
    }
};

void f(NoExceptMethod auto a) {}

int main() {
    NoExcept x{};

    f(x);
}
```

But this doesn't compile?

```c++
#include <concepts>
#include <cstdint>

template<typename T>
concept NoExceptMethod = requires (T a) {
    // Note that we simply replaced `noexcept` with `const`
    { a.method() } const -> std::same_as<std::uint64_t>;
};

class NoExcept {
public:
    // Note that we simply replaced `noexcept` with `const`
    std::uint64_t method() const {
        return 42;
    }
};

void f(NoExceptMethod auto a) {}

int main() {
    NoExcept x{};

    f(x);
}
```

```text
<source>:6:19: error: expected ';' before 'const'
    6 |     { a.method() } const -> std::same_as<std::uint64_t>;
      |                   ^~~~~~
      |                   ;
```

In general: exceptions add an orthogonal dimension of complexity on top of `const` because of how
difficult it is to deduce `noexcept` in practice. See also
http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2019/p1667r0.html

Also, concepts getting so hard to understand that we write test cases:
https://andreasfertig.blog/2020/08/cpp20-concepts-testing-constrained-functions/

And for handling `volatile`:

```c++
#include <concepts>
#include <cstdint>

template<typename T>
concept VolatileMethod = requires(volatile T a) {
    { a.method() } -> std::same_as<std::uint64_t>;
};

class Volatile {
public:
    std::uint64_t method() volatile {
        return 42;
    }
};

void f(VolatileMethod auto a) {
    a.method();
}

int main() {
    Volatile x{};

    f(x);
}
```

Though the compiler nicely warns us that we shouldn't do this:

```text
<source>:5:46: warning: 'volatile'-qualified parameter is deprecated [-Wvolatile]
    5 | concept VolatileMethod = requires(volatile T a) {
      |                                   ~~~~~~~~~~~^
```

C++ also has `override` and `final`, but doesn't make much sense to impose that as a requirement;
inheritance and concepts are orthogonal systems.

# Implement methods on remote types

Rust allows both arbitrary `self` and extension traits. Arbitrary self forms the basis of the
`async` system in Rust. Extension traits form basis of `futures` library. Accomplish effectively the
same thing, but for concrete types and traits respectively.

UFCS would achieve the same effect, but unclear if/when it will be available:
https://dancrn.com/2020/08/02/ufcs-in-clang.html

Can use free functions in the meantime, but having the IDE auto-complete `.<the next thing>` is
exceedingly useful, as opposed to looking through all functions in a namespace.

Can also sub-class or implicitly convert to a wrapper:

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

    // This _will not_ compile because `auto` doesn't trigger the conversion to `LocalImpl`
    //auto_func(x);

    // This _will_ compile because the function signature declares a concrete class for which an
    // implicit conversion is available. It just so happens that `LocalImpl` satisfies `MyConcept`.
    regular_func(x);
}
```

The `LocalImpl` wrapper could be extended to handle additional remote types using template
specialization or holding an internal `std::variant`, but that misses the point: we want to write
code that accepts anything that satisfies `MyConcept`. When we write functions that require a
specific wrapper, we're being overly restrictive, and obfuscating our intentions (we don't actually
care about the wrapper, it's just there for ease-of-use).

Can use some overloading/specialization tricks for ease of use:

```c++
auto some_func_(MyConcept auto value) -> void {
    auto x = value.do_something();
}

auto some_func(MyConcept auto value) -> void {
    some_func_(value);
}

void some_func(LocalImpl value) {
    some_func_(value);
}
```

Need to be careful though:

```c++
auto some_func(MyConcept auto value) -> void {
    auto x = value.do_something();
}

void some_func(LocalImpl value) {
    // NOTE: Because `LocalImpl` is more specific than `auto`, this is a recursive call and
    // will overflow the stack.
    // We use `some_func_` above to uniquely name the function we actually want to call.
    some_func(value);
}
```

Potentially worth mentioning orphan rule in Rust as limit to extension methods - can't implement
remote traits for remote types.

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

# Templated splatter

Rust can't handle arbitrary numbers of template parameters. Macros can (see `vec![]`), and you could
use a macro to define the implementation of free functions, but methods need to know exactly what
the arguments are. Also, no concept of SFINAE or type inspection in Rust macros.

Good example of how to demonstrate Rust not being able to use splatter templates: can't emplace back
on a vector. Have to construct and move. In general, don't think it's possible to "construct" into a
pre-existing address; could use same variation of unsafe to say "I know how large i am, I know my
layout, I have a pointer to where I begin, set it all up," but even that would have to be defined on
the struct, `Vec` can't forward args to this initializer method.  
That said, open question as to whether the move vs. construct-in-place/placement new matters given
an optimizing compiler: https://stackoverflow.com/a/36919571

Also: `std::initializer_list` (although Rust can get _very_ close with macros: `vec!`).

# CRTP

Might not need to be an extensive section? CRTP lets bases reference children. Rust has no struct
inheritance, but some CRTP stuff can be used with traits.

Review of the examples Wikipedia gives:

- Static polymorphism: Traits are allowed to declare that implementors define an `implementation()`
  and then provide default implementations of other methods that use it (without virtual calls). Not
  a common pattern though; use composition, not inheritance. https://godbolt.org/z/Md55e7
- Object counter: I don't think Rust has a way to accomplish this; traits aren't allowed to hold
  data.
- Polymorphic chaining: Feel free to return `Self`, `&Self`, etc., builder patterns aren't new.

# Potentially excluded

Some ideas related to traits, but that I'm not sure sufficiently fit the theme. May be worth
investigating in a future post?

## Visibility

Worth acknowledging that C++ can do interesting things with `protected`, `friend`, and others, that
Rust can't. However, Rust can limit trait implementations to current crate ("sealed traits"), where
C++ concepts are purely duck typing.

## Move/consume `self` as opposed to `&self`?

Handled as part of method qualifiers.

Not exactly polymorphism, but is a significant feature of Rust trait system. Is there a way to force
`std::move(object).method()`? C++ can still use objects after movement makes them invalid, so not
sure that it makes conceptual sense - it's your job to prevent use-after-move, not the compiler's.

## Automatic markers?

Alternately, conditional inheritance based on templates?

## Arbitrary `self`

Handled as part of section on `impl Trait` for remote type, not sure this needs it's own section.

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

# Trait objects as arguments

Handled as part of `decltype` and compiler-named types, not sure it needs it's own section.

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
