---
layout: post
title: "Representing Hierarchies - The TypedStack Pattern"
description: ""
category: 
tags: [rust]
---

# Quick Object-Oriented Review

TODO: Comment that I'm trying to explain the motivation?

Rust is "object oriented" in the sense that structs provide data encapsulation, `impl` blocks provide behavior,
and trait objects/trait inheritance provide polymorphism. Functions can accept trait objects, and make use of trait bounds
to specify exactly what behavior is expected. Java provides a remarkably similar pattern where classes encapsulate
data and behavior, and interfaces can extend each other to provide the same polymorphism. The crucial difference
in Java is that classes (in addition to interfaces) can inherit, which Rust very explicitly 
[doesn't do](https://doc.rust-lang.org/stable/book/ch17-01-what-is-oo.html#inheritance-as-a-type-system-and-as-code-sharing).

From the perspective of an API designer, the benefit of of class inheritance don't really show up. As a quick example,
the Rust and Java are basically equivalent:

```rust
trait Quack {
    fn quack(&self);
}
trait Swim {
    fn swim(&self);
}
trait DuckLike: Quack + Swim;

fn exercise(duck: &DuckLike) {
    duck.quack();
    duck.swim();
}
```

```java
class Definitions {
    interface Quack {
        void quack();
    }
    interface Swim {
        void swim();
    }
    interface DuckLike extends Quack, Swim {}

    static void exercise(Duck d) {
        d.quack();
        d.swim();
    }
}
```

However, programmers responsible for actually implementing those definitions have the potential to benefit. In Java,
child classes inherit all behavior from the parent for free:

```java
class Implementation {
    static class GeneralDuck implements DuckLike {
        void quack() {
            System.out.println("Quack.");
        }

        void swim() {
            System.out.println("*paddles furiously*");
        }
    }

    static class Muscovy extends GeneralDuck {}
    static class Mandarin extends GeneralDuck {}

    public static void main(String[] args) {
        Muscovy muscovy = new Muscovy();
        Mandarin mandarin = new Mandarin();

        // Even though the `Muscovy` and `Mandarin` classes never declare
        // that they implement `DuckLike`, they are able to be exercised
        // because they inherit behavior from the parent `GeneralDuck`
        Definitions.exercise(muscovy);
        Definitions.exercise(mandarin);
    }
}
```

Because Rust has no concept of "struct inheritance", the code looks a bit different. A common pattern
implementing this example is to have the "child" structures own the "parent", and dispatch methods
as necessary:

```rust
struct GeneralDuck;
impl DuckLike for GeneralDuck {
    fn quack(&self) {
        println!("Quack.");
    }

    fn swim(&self) {
        println!("*paddles furiously*");
    }
}

struct Muscovy {
    d: GeneralDuck
}

struct Mandarin {
    d: GeneralDuck
}

impl DuckLike for Muscovy {
    fn quack(&self) {
        self.d.quack();
    }

    fn swim(&self) {
        self.d.swim();
    }
}

impl DuckLike for Mandarin {
    fn quack(&self) {
        self.d.quack();
    }

    fn swim(&self) {
        self.d.swim();
    }
}
```

There are a couple things worth pointing out that this pattern does well, even better than Java:
1. Avoiding `abstract class` shenanigans; the "parent" struct has no way of influencing or coordinating with
   the "child" implementations.
2. Type specificity; Java allows downcasting the more specific type to being less specific, `List<T> myList = new ArrayList<>()` is legal

However, there are two issues with this pattern:

1. Implementations of `DuckLike` are simplistic and repetitive; for more complex hierarchies,
   writing the forwarding methods by hand is untenable. The Rust book [recommends](https://doc.rust-lang.org/stable/book/ch17-03-oo-design-patterns.html#trade-offs-of-the-state-pattern)
   macros as a way to generate the necessary code, but might cause issues if, for example,
   we want to forward only select methods within a trait.
2. Ownership; there are a couple situations in which we'd rather have the parent own the children.
   The two cases I'm aware of where this is helpful are [writing GUIs](https://hackernoon.com/why-im-dropping-rust-fd1c32986c88)
   and parsing binary streams; GUIs want to have a single node that manages the children, and network protocols
   often have an outer frame that encapsulates the inner (more specific) frames/data.

While issue 1 can be remedied through writing more (admittedly tedious) code, issue 2 poses
a challenge to how hierarchies are modeled in Rust.

# Inverting Ownership


