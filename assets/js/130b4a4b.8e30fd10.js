"use strict";(self.webpackChunkspeice_io=self.webpackChunkspeice_io||[]).push([["294"],{6056:function(e,n,t){t.r(n),t.d(n,{assets:function(){return l},contentTitle:function(){return o},default:function(){return h},frontMatter:function(){return a},metadata:function(){return i},toc:function(){return c}});var i=t(7497),s=t(5893),r=t(65);let a={slug:"2018/09/primitives-in-rust-are-weird",title:"Primitives in Rust are weird (and cool)",date:new Date("2018-09-01T12:00:00.000Z"),authors:["bspeice"],tags:[]},o=void 0,l={authorsImageUrls:[void 0]},c=[{value:"Defining primitives (Java)",id:"defining-primitives-java",level:2},{value:"Low Level Handling of Primitives (C)",id:"low-level-handling-of-primitives-c",level:2},{value:"impl primitive (and Python)",id:"impl-primitive-and-python",level:2},{value:"Conclusion",id:"conclusion",level:2}];function d(e){let n={a:"a",blockquote:"blockquote",code:"code",em:"em",h2:"h2",p:"p",pre:"pre",strong:"strong",...(0,r.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.p,{children:"I wrote a really small Rust program a while back because I was curious. I was 100% convinced it\ncouldn't possibly run:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-rust",children:'fn main() {\n    println!("{}", 8.to_string())\n}\n'})}),"\n",(0,s.jsx)(n.p,{children:"And to my complete befuddlement, it compiled, ran, and produced a completely sensible output."}),"\n",(0,s.jsxs)(n.p,{children:["The reason I was so surprised has to do with how Rust treats a special category of things I'm going to\ncall ",(0,s.jsx)(n.em,{children:"primitives"}),". In the current version of the Rust book, you'll see them referred to as\n",(0,s.jsx)(n.a,{href:"https://doc.rust-lang.org/book/second-edition/ch03-02-data-types.html#scalar-types",children:"scalars"}),", and in older versions they'll be called ",(0,s.jsx)(n.a,{href:"https://doc.rust-lang.org/book/first-edition/primitive-types.html",children:"primitives"}),", but\nwe're going to stick with the name ",(0,s.jsx)(n.em,{children:"primitive"})," for the time being. Explaining why this program is so\ncool requires talking about a number of other programming languages, and keeping a consistent\nterminology makes things easier."]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.strong,{children:"You've been warned:"})," this is going to be a tedious post about a relatively minor issue that\ninvolves Java, Python, C, and x86 Assembly. And also me pretending like I know what I'm talking\nabout with assembly."]}),"\n",(0,s.jsx)(n.h2,{id:"defining-primitives-java",children:"Defining primitives (Java)"}),"\n",(0,s.jsxs)(n.p,{children:["The reason I'm using the name ",(0,s.jsx)(n.em,{children:"primitive"})," comes from how much of my life is Java right now. For the most part I like Java, but I digress. In Java, there's a special\nname for some specific types of values:"]}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:"bool    char    byte\nshort   int     long\nfloat   double\n"})}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["They are referred to as ",(0,s.jsx)(n.a,{href:"https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html",children:"primitives"}),". And relative to the other bits of Java,\nthey have two unique features. First, they don't have to worry about the\n",(0,s.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Tony_Hoare#Apologies_and_retractions",children:"billion-dollar mistake"}),";\nprimitives in Java can never be ",(0,s.jsx)(n.code,{children:"null"}),". Second: ",(0,s.jsx)(n.em,{children:"they can't have instance methods"}),".\nRemember that Rust program from earlier? Java has no idea what to do with it:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-java",children:"class Main {\n    public static void main(String[] args) {\n        int x = 8;\n        System.out.println(x.toString()); // Triggers a compiler error\n    }\n}\n"})}),"\n",(0,s.jsx)(n.p,{children:"The error is:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:"Main.java:5: error: int cannot be dereferenced\n        System.out.println(x.toString());\n                            ^\n1 error\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Specifically, Java's ",(0,s.jsx)(n.a,{href:"https://docs.oracle.com/javase/10/docs/api/java/lang/Object.html",children:(0,s.jsx)(n.code,{children:"Object"})}),"\nand things that inherit from it are pointers under the hood, and we have to dereference them before\nthe fields and methods they define can be used. In contrast, ",(0,s.jsx)(n.em,{children:"primitive types are just values"})," -\nthere's nothing to be dereferenced. In memory, they're just a sequence of bits."]}),"\n",(0,s.jsxs)(n.p,{children:["If we really want, we can turn the ",(0,s.jsx)(n.code,{children:"int"})," into an\n",(0,s.jsx)(n.a,{href:"https://docs.oracle.com/javase/10/docs/api/java/lang/Integer.html",children:(0,s.jsx)(n.code,{children:"Integer"})})," and then dereference\nit, but it's a bit wasteful:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-java",children:"class Main {\n    public static void main(String[] args) {\n        int x = 8;\n        Integer y = Integer.valueOf(x);\n        System.out.println(y.toString());\n    }\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["This creates the variable ",(0,s.jsx)(n.code,{children:"y"})," of type ",(0,s.jsx)(n.code,{children:"Integer"})," (which inherits ",(0,s.jsx)(n.code,{children:"Object"}),"), and at run time we\ndereference ",(0,s.jsx)(n.code,{children:"y"})," to locate the ",(0,s.jsx)(n.code,{children:"toString()"})," function and call it. Rust obviously handles things a bit\ndifferently, but we have to dig into the low-level details to see it in action."]}),"\n",(0,s.jsx)(n.h2,{id:"low-level-handling-of-primitives-c",children:"Low Level Handling of Primitives (C)"}),"\n",(0,s.jsxs)(n.p,{children:["We first need to build a foundation for reading and understanding the assembly code the final answer\nrequires. Let's begin with showing how the ",(0,s.jsx)(n.code,{children:"C"}),' language (and your computer) thinks about "primitive"\nvalues in memory:']}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-c",children:"void my_function(int num) {}\n\nint main() {\n    int x = 8;\n    my_function(x);\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["The ",(0,s.jsx)(n.a,{href:"https://godbolt.org/z/lgNYcc",children:"compiler explorer"})," gives us an easy way of showing off the\nassembly-level code that's generated: ",(0,s.jsx)("small",{children:"whose output has been lightly\nedited"})]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-nasm",children:"main:\n        push    rbp\n        mov     rbp, rsp\n        sub     rsp, 16\n\n        ; We assign the value `8` to `x` here\n        mov     DWORD PTR [rbp-4], 8\n\n        ; And copy the bits making up `x` to a location\n        ; `my_function` can access (`edi`)\n        mov     eax, DWORD PTR [rbp-4]\n        mov     edi, eax\n\n        ; Call `my_function` and give it control\n        call    my_function\n\n        mov     eax, 0\n        leave\n        ret\n\nmy_function:\n        push    rbp\n        mov     rbp, rsp\n\n        ; Copy the bits out of the pre-determined location (`edi`)\n        ; to somewhere we can use\n        mov     DWORD PTR [rbp-4], edi\n        nop\n\n        pop     rbp\n        ret\n"})}),"\n",(0,s.jsxs)(n.p,{children:["At a really low level of memory, we're copying bits around using the ",(0,s.jsx)(n.a,{href:"http://www.cs.virginia.edu/~evans/cs216/guides/x86.html",children:(0,s.jsx)(n.code,{children:"mov"})})," instruction;\nnothing crazy. But to show how similar Rust is, let's take a look at our program translated from C\nto Rust:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-rust",children:"fn my_function(x: i32) {}\n\nfn main() {\n    let x = 8;\n    my_function(x)\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["And the assembly generated when we stick it in the\n",(0,s.jsx)(n.a,{href:"https://godbolt.org/z/cAlmk0",children:"compiler explorer"}),": ",(0,s.jsx)("small",{children:"again, lightly\nedited"})]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-nasm",children:"example::main:\n  push rax\n\n  ; Look familiar? We're copying bits to a location for `my_function`\n  ; The compiler just optimizes out holding `x` in memory\n  mov edi, 8\n\n  ; Call `my_function` and give it control\n  call example::my_function\n\n  pop rax\n  ret\n\nexample::my_function:\n  sub rsp, 4\n\n  ; And copying those bits again, just like in C\n  mov dword ptr [rsp], edi\n\n  add rsp, 4\n  ret\n"})}),"\n",(0,s.jsxs)(n.p,{children:["The generated Rust assembly is functionally pretty close to the C assembly: ",(0,s.jsx)(n.em,{children:"When working with\nprimitives, we're just dealing with bits in memory"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["In Java we have to dereference a pointer to call its functions; in Rust, there's no pointer to\ndereference. So what exactly is going on with this ",(0,s.jsx)(n.code,{children:".to_string()"})," function call?"]}),"\n",(0,s.jsx)(n.h2,{id:"impl-primitive-and-python",children:"impl primitive (and Python)"}),"\n",(0,s.jsxs)(n.p,{children:["Now it's time to ",(0,s.jsx)("strike",{children:"reveal my trap card"})," show the revelation that tied all this\ntogether: ",(0,s.jsx)(n.em,{children:"Rust has implementations for its primitive types."})," That's right, ",(0,s.jsx)(n.code,{children:"impl"})," blocks aren't\nonly for ",(0,s.jsx)(n.code,{children:"structs"})," and ",(0,s.jsx)(n.code,{children:"traits"}),", primitives get them too. Don't believe me? Check out\n",(0,s.jsx)(n.a,{href:"https://doc.rust-lang.org/std/primitive.u32.html",children:"u32"}),",\n",(0,s.jsx)(n.a,{href:"https://doc.rust-lang.org/std/primitive.f64.html",children:"f64"})," and\n",(0,s.jsx)(n.a,{href:"https://doc.rust-lang.org/std/primitive.char.html",children:"char"})," as examples."]}),"\n",(0,s.jsxs)(n.p,{children:["But the really interesting bit is how Rust turns those ",(0,s.jsx)(n.code,{children:"impl"})," blocks into assembly. Let's break out\nthe ",(0,s.jsx)(n.a,{href:"https://godbolt.org/z/6LBEwq",children:"compiler explorer"})," once again:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-rust",children:"pub fn main() {\n    8.to_string()\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["And the interesting bits in the assembly: ",(0,s.jsx)("small",{children:"heavily trimmed down"})]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-nasm",children:"example::main:\n  sub rsp, 24\n  mov rdi, rsp\n  lea rax, [rip + .Lbyte_str.u]\n  mov rsi, rax\n\n  ; Cool stuff right here\n  call <T as alloc::string::ToString>::to_string@PLT\n\n  mov rdi, rsp\n  call core::ptr::drop_in_place\n  add rsp, 24\n  ret\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Now, this assembly is a bit more complicated, but here's the big revelation: ",(0,s.jsxs)(n.strong,{children:["we're calling\n",(0,s.jsx)(n.code,{children:"to_string()"})," as a function that exists all on its own, and giving it the instance of ",(0,s.jsx)(n.code,{children:"8"})]}),". Instead\nof thinking of the value 8 as an instance of ",(0,s.jsx)(n.code,{children:"u32"})," and then peeking in to find the location of the\nfunction we want to call (like Java), we have a function that exists outside of the instance and\njust give that function the value ",(0,s.jsx)(n.code,{children:"8"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["This is an incredibly technical detail, but the interesting idea I had was this: ",(0,s.jsxs)(n.em,{children:["if ",(0,s.jsx)(n.code,{children:"to_string()"}),"\nis a static function, can I refer to the unbound function and give it an instance?"]})]}),"\n",(0,s.jsxs)(n.p,{children:["Better explained in code (and a ",(0,s.jsx)(n.a,{href:"https://godbolt.org/z/fJY-gA",children:"compiler explorer"})," link because I\nseriously love this thing):"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-rust",children:"struct MyVal {\n    x: u32\n}\n\nimpl MyVal {\n    fn to_string(&self) -> String {\n        self.x.to_string()\n    }\n}\n\npub fn main() {\n    let my_val = MyVal { x: 8 };\n\n    // THESE ARE THE SAME\n    my_val.to_string();\n    MyVal::to_string(&my_val);\n}\n"})}),"\n",(0,s.jsx)(n.p,{children:'Rust is totally fine "binding" the function call to the instance, and also as a static.'}),"\n",(0,s.jsx)(n.p,{children:"MIND == BLOWN."}),"\n",(0,s.jsx)(n.p,{children:"Python does the same thing where I can both call functions bound to their instances and also call as\nan unbound function where I give it the instance:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:"class MyClass():\n    x = 24\n\n    def my_function(self):\n        print(self.x)\n\nm = MyClass()\n\nm.my_function()\nMyClass.my_function(m)\n"})}),"\n",(0,s.jsxs)(n.p,{children:["And Python tries to make you ",(0,s.jsx)(n.em,{children:"think"})," that primitives can have instance methods..."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:">>> dir(8)\n['__abs__', '__add__', '__and__', '__class__', '__cmp__', '__coerce__',\n'__delattr__', '__div__', '__divmod__', '__doc__', '__float__', '__floordiv__',\n...\n'__setattr__', '__sizeof__', '__str__', '__sub__', '__subclasshook__', '__truediv__',\n...]\n\n>>> # Theoretically `8.__str__()` should exist, but:\n\n>>> 8.__str__()\n  File \"<stdin>\", line 1\n    8.__str__()\n             ^\nSyntaxError: invalid syntax\n\n>>> # It will run if we assign it first though:\n>>> x = 8\n>>> x.__str__()\n'8'\n"})}),"\n",(0,s.jsx)(n.p,{children:"...but in practice it's a bit complicated."}),"\n",(0,s.jsx)(n.p,{children:"So while Python handles binding instance methods in a way similar to Rust, it's still not able to\nrun the example we started with."}),"\n",(0,s.jsx)(n.h2,{id:"conclusion",children:"Conclusion"}),"\n",(0,s.jsx)(n.p,{children:"This was a super-roundabout way of demonstrating it, but the way Rust handles incredibly minor\ndetails like primitives leads to really cool effects. Primitives are optimized like C in how they\nhave a space-efficient memory layout, yet the language still has a lot of features I enjoy in Python\n(like both instance and late binding)."}),"\n",(0,s.jsxs)(n.p,{children:["And when you put it together, there are areas where Rust does cool things nobody else can; as a\nquirky feature of Rust's type system, ",(0,s.jsx)(n.code,{children:"8.to_string()"})," is actually valid code."]}),"\n",(0,s.jsx)(n.p,{children:"Now go forth and fool your friends into thinking you know assembly. This is all I've got."})]})}function h(e={}){let{wrapper:n}={...(0,r.a)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},65:function(e,n,t){t.d(n,{Z:function(){return o},a:function(){return a}});var i=t(7294);let s={},r=i.createContext(s);function a(e){let n=i.useContext(r);return i.useMemo(function(){return"function"==typeof e?e(n):{...n,...e}},[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:a(e.components),i.createElement(r.Provider,{value:n},e.children)}},7497:function(e){e.exports=JSON.parse('{"permalink":"/2018/09/primitives-in-rust-are-weird","source":"@site/blog/2018-09-01-primitives-in-rust-are-weird/index.mdx","title":"Primitives in Rust are weird (and cool)","description":"I wrote a really small Rust program a while back because I was curious. I was 100% convinced it","date":"2018-09-01T12:00:00.000Z","tags":[],"readingTime":6.945,"hasTruncateMarker":true,"authors":[{"name":"Bradlee Speice","socials":{"github":"https://github.com/bspeice"},"key":"bspeice","page":null}],"frontMatter":{"slug":"2018/09/primitives-in-rust-are-weird","title":"Primitives in Rust are weird (and cool)","date":"2018-09-01T12:00:00.000Z","authors":["bspeice"],"tags":[]},"unlisted":false,"lastUpdatedAt":1731187596000,"prevItem":{"title":"Isomorphic desktop apps with Rust","permalink":"/2018/09/isomorphic-apps"},"nextItem":{"title":"What I learned porting dateutil to Rust","permalink":"/2018/06/dateutil-parser-to-rust"}}')}}]);