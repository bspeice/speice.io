Title: A Rustic Re-Podcasting Server (Part 1)
Date: 2016-10-22
Category: Blog
Tags: Rust, nutone
Authors: Bradlee Speice
Summary: Learning Rust by fire (it sounds better than learning by corrosion)
[//]: <> "Modified: "

I listen to a lot of Drum and Bass music, because it's beautiful music. And
there's a particular site, [Bassdrive.com](http://bassdrive.com/) that hosts
a lot of great content. Specifically, the
[archives](http://archives.bassdrivearchive.com/) section of the site has a
list of the past shows that you can download and listen to. The issue is, it's
just a [giant list of links to download](http://archives.bassdrivearchive.com/6%20-%20Saturday/Electronic%20Warfare%20-%20The%20Overfiend/). I'd really like
this in a podcast format to take with me on the road, etc.

So I wrote the [elektricity](https://github.com/bspeice/elektricity) web
application to actually accomplish all that. Whenever you request a feed, it
goes out to Bassdrive, processes all the links on a page, and serves up some
fresh, tasty RSS to satisfy your ears. I hosted it on Heroku using the free
tier because it's really not resource-intensive at all.

**The issue so far** is that I keep running out of free tier hours during a
month because my podcasting application likes to have a server scan for new
episodes constantly. Not sure why it's doing that, but I don't have a whole
lot of control over it. It's a phenomenal application otherwise.

**My (over-engineered) solution**: Re-write the application using the
[Rust](https://www.rust-lang.org/en-US/) programming language. I'd like to run
this on a small hacker board I own, and doing this in Rust would allow me to
easily cross-compile it. Plus, I've been very interested in the Rust language
for a while and this would be a great opportunity to really learn it well.
The code is available [here](https://github.com/bspeice/nutone) as development
progresses.

# The Setup

We'll be using the [iron](http://ironframework.io/) library to handle the
server, and [hyper](http://hyper.rs/) to fetch the data we need from elsewhere
on the interwebs. [HTML5Ever](http://doc.servo.org/html5ever/index.html) allows
us to ingest the content that will be coming from Bassdrive, and finally,
output is done with [handlebars-rust](http://sunng87.github.io/handlebars-rust/handlebars/index.html).

It will ultimately be interesting to see how much more work must be done to
actually get this working over another language like Python. Coming from a
dynamic state of mind it's super easy to just chain stuff together, ship it out,
and call it a day. I think I'm going to end up getting much dirtier trying to
write all of this out.

# Issue 1: Strings

Strings in Rust are hard. I acknowledge Python can get away with some things
that make strings super easy (and Python 3 has gotten better at cracking down
on some bad cases, `str <-> bytes` specifically), but Rust is hard.

Let's take for example the `404` error handler I'm trying to write. The result
should be incredibly simple: All I want is to echo back
`Didn't find URL: <url>`. Shouldn't be that hard right? In Python I'd just do
something like:

```python
def echo_handler(request):
    return "You're visiting: {}".format(request.uri)
```

And we'd call it a day. Rust isn't so simple. Let's start with the trivial
examples people post online:

```rust
fn hello_world(req: &mut Request) -> IronResult<Response> {
    Ok(Response::with((status::Ok, "You found the server!")))
}
```

Doesn't look too bad right? In fact, it's essentially the same as the Python
version! All we need to do is just send back a string of some form. So, we
look up the documentation for [`Request`](http://ironframework.io/doc/iron/request/struct.Request.html) and see a `url` field that will contain
what we want. Let's try the first iteration:

```rust
fn hello_world(req: &mut Request) -> IronResult<Response> {
    Ok(Response::with((status::Ok, "You found the URL: " + req.url)))
}
```

Which yields the error:

    error[E0369]: binary operation `+` cannot be applied to type `&'static str`

OK, what's going on here? Time to start Googling for ["concatenate strings in Rust"](https://www.google.com/#q=concatenate+strings+in+rust). That's what we
want to do right? Concatenate a static string and the URL.

After Googling, we come across a helpful [`concat!`](https://doc.rust-lang.org/std/macro.concat!.html) macro that looks really nice! Let's try that one:

```rust
fn hello_world(req: &mut Request) -> IronResult<Response> {
    Ok(Response::with((status::Ok, concat!("You found the URL: ", req.url))))
}
```

And the error:

`error: expected a literal`

Turns out Rust actually blows up because the `concat!` macro expects us to know
at compile time what `req.url` is. Which, in my outsider opinion, is a bit
strange. `println!` and `format!`, etc., all handle values they don't know at
compile time. Why can't `concat!`? By any means, we need a new plan of attack.
How about we try formatting strings?

```rust
fn hello_world(req: &mut Request) -> IronResult<Response> {
    Ok(Response::with((status::Ok, format!("You found the URL: {}", req.url))))
}
```

And at long last, it works. Onwards!

# Issue 2: Fighting with the borrow checker

Rust's single coolest feature is how the compiler can guarantee safety in your
program. As long as you don't use `unsafe` pointers in Rust, you're guaranteed
safety. And not having truly manual memory management is really cool; I'm
totally OK with never having to write `malloc()` again.

That said, even [the Rust documentation](https://doc.rust-lang.org/book/ownership.html) makes a specific note:

> Many new users to Rust experience something we like to call
> ‘fighting with the borrow checker’, where the Rust compiler refuses to
> compile a program that the author thinks is valid.

If you have to put it in the documentation, it's not a helpful note:
it's hazing.

So now that we have a handler which works with information from the request, we
want to start making something that looks like an actual web application.
The router provided by `iron` isn't terribly difficult so I won't cover it.
Instead, the thing that had me stumped for a couple hours was trying to
dynamically create routes.

The unfortunate thing with Rust (in my limited experience at the moment) is that
there is a severe lack of non-trivial examples. Using the router is easy when
you want to give an example of a static function. But how do you you start
working on things that are a bit more complex?

We're going to cover that here. Our first try: creating a function which returns
other functions. This is a principle called [currying](http://stackoverflow.com/a/36321/1454178). We set up a function that allows us to keep some data in scope
for another function to come later.

```rust
fn build_handler(message: String) -> Fn(&mut Request) -> IronResult<Response> {
    move |_: &mut Request| {
        Ok(Response::with((status::Ok, message)))
    }
}
```

We've simply set up a function that returns another anonymous function with the
`message` parameter scoped in. If you compile this, you get not 1, not 2, but 5
new errors. 4 of them are the same though:

    error[E0277]: the trait bound `for<'r, 'r, 'r> std::ops::Fn(&'r mut iron::Request<'r, 'r>) -> std::result::Result<iron::Response, iron::IronError> + 'static: std::marker::Sized` is not satisfied

...oookay. I for one, am not going to spend time trying to figure out what's
going on there.

And it is here that I will save the audience many hours of frustrated effort.
At this point, I decided to switch from `iron` to pure `hyper` since using
`hyper` would give me a much simpler API. All I would have to do is build a
function that took two parameters as input, and we're done. That said, it
ultimately posed many more issues because I started getting into a weird fight
with the `'static` [lifetime](https://doc.rust-lang.org/book/lifetimes.html)
and being a Rust newbie I just gave up on trying to understand it.

Instead, we will abandon (mostly) the curried function attempt, and instead
take advantage of something Rust actually intends us to use: `struct` and
`trait`.

Remember when I talked about a lack of non-trivial examples on the Internet?
This is what I was talking about. I could only find *one* example of this
available online, and it was incredibly complex and contained code we honestly
don't need or care about. There was no documentation of how to build routes that
didn't use static functions, etc. But, I'm assuming you don't really care about
my whining, so let's get to it.

The `iron` documentation mentions the [`Handler`](http://ironframework.io/doc/iron/middleware/trait.Handler.html) trait as being something we can implement.
Does the function signature for that `handle()` method look familiar? It's what
we've been working with so far.

The principle is that we need to define a new `struct` to hold our data, then
implement that `handle()` method to return the result. Something that looks
like this might do:

```rust
struct EchoHandler {
    message: String
}

impl Handler for EchoHandler {
    fn handle(&self, _: &mut Request) -> IronResult<Response> {
        Ok(Response::with((status::Ok, self.message)))
    }
}

// Later in the code when we set up the router...
let echo = EchoHandler {
    message: "Is it working yet?"
}
router.get("/", echo.handle, "index");
```

We attempt to build a struct, and give its `handle` method off to the router
so the router knows what to do.

You guessed it, more errors:

    error: attempted to take value of method `handle` on type `EchoHandler`

Now, the Rust compiler is actually a really nice fellow, and offers us help:

    help: maybe a `()` to call it is missing? If not, try an anonymous function

We definitely don't want to call that function, so maybe try an anonymous
function as it recommends?

```rust
router.get("/", |req: &mut Request| echo.handle(req), "index");
```

Another error:

    error[E0373]: closure may outlive the current function, but it borrows `echo`, which is owned by the current function

Another helpful message:

    help: to force the closure to take ownership of `echo` (and any other referenced variables), use the `move` keyword

We're getting closer though! Let's implement this change:

```rust
router.get("/", move |req: &mut Request| echo.handle(req), "index");
```

And here's where things get strange:

    error[E0507]: cannot move out of borrowed content
      --> src/main.rs:18:40
       |
    18 |         Ok(Response::with((status::Ok, self.message)))
       |                                        ^^^^ cannot move out of borrowed content

Now, this took me another couple hours to figure out. I'm going to explain it,
but **keep this in mind: Rust only allows one reference at a time** (exceptions
apply of course).

When we attempt to use `self.message` as it has been created in the earlier
`struct`, we essentially are trying to give it away to another piece of code.
Rust's semantics then state that *we may no longer access it* unless it is
returned to us (which `iron`'s code does not do). There are two ways to fix
this:

1. Only give away references (i.e. `&self.message` instead of `self.message`)
instead of transferring ownership
2. Make a copy of the underlying value which will be safe to give away

I didn't know these were the two options originally, so I hope this helps the
audience out. Because `iron` won't accept a reference, we are forced into the
second option: making a copy. To do so, we just need to change the function
to look like this:

```rust
Ok(Response::with((status::Ok, self.message.clone())))
```

Not so bad, huh? My only complaint is that it took so long to figure out exactly
what was going on.

And now we have a small server that we can configure dynamically. At long last.

> Final sidenote: You can actually do this without anonymous functions. Just
> change the router line to:
>     `router.get("/", echo, "index");`
>
> Rust's type system seems to figure out that we want to use the `handle()` method.

# Conclusion

After a good long days' work, we now have the routing functionality set up on
our application. We should be able to scale this pretty well in the future:
the RSS content we need to deliver in the future can be treated as a string, so
the building blocks are in place.

There are two important things I learned starting with Rust today:

1. Rust is a new language, and while the code is high-quality, the mindshare is coming.
2. I'm a terrible programmer.

Number 1 is pretty obvious and not surprising to anyone. Number two caught me
off guard. I've gotten used to having either a garbage collector (Java, Python,
etc.) or playing a little fast and loose with scoping rules (C, C++). You don't
have to worry about object lifetime there. With Rust, it's forcing me to fully
understand and use well the memory in my applications. In the final mistake I
fixed (using `.clone()`) I would have been fine in C++ to just give away that
reference and never use it again. I wouldn't have run into a "use-after-free"
error, but I would have potentially been leaking memory. Rust forced me to be
incredibly precise about how I use it.

All said I'm excited for using Rust more. I think it's super cool, it's just
going to take me a lot longer to do this than I originally thought.
