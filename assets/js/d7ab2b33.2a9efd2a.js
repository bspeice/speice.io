"use strict";(self.webpackChunkspeice_io=self.webpackChunkspeice_io||[]).push([["9127"],{4487:function(e,t,n){n.r(t),n.d(t,{assets:function(){return l},contentTitle:function(){return r},default:function(){return m},frontMatter:function(){return a},metadata:function(){return s},toc:function(){return u}});var s=n(5238),i=n(5893),o=n(65);let a={slug:"2019/02/a-heaping-helping",title:"Allocations in Rust: Dynamic memory",date:new Date("2019-02-07T12:00:00.000Z"),authors:["bspeice"],tags:[]},r=void 0,l={authorsImageUrls:[void 0]},u=[];function c(e){let t={a:"a",em:"em",p:"p",strong:"strong",...(0,o.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(t.p,{children:["Managing dynamic memory is hard. Some languages assume users will do it themselves (C, C++), and\nsome languages go to extreme lengths to protect users from themselves (Java, Python). In Rust, how\nthe language uses dynamic memory (also referred to as the ",(0,i.jsx)(t.strong,{children:"heap"}),") is a system called ",(0,i.jsx)(t.em,{children:"ownership"}),".\nAnd as the docs mention, ownership\n",(0,i.jsx)(t.a,{href:"https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html",children:"is Rust's most unique feature"}),"."]}),"\n",(0,i.jsxs)(t.p,{children:["The heap is used in two situations; when the compiler is unable to predict either the ",(0,i.jsx)(t.em,{children:"total size of\nmemory needed"}),", or ",(0,i.jsx)(t.em,{children:"how long the memory is needed for"}),", it allocates space in the heap."]})]})}function m(e={}){let{wrapper:t}={...(0,o.a)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},65:function(e,t,n){n.d(t,{Z:function(){return r},a:function(){return a}});var s=n(7294);let i={},o=s.createContext(i);function a(e){let t=s.useContext(o);return s.useMemo(function(){return"function"==typeof e?e(t):{...t,...e}},[t,e])}function r(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:a(e.components),s.createElement(o.Provider,{value:t},e.children)}},5238:function(e){e.exports=JSON.parse('{"permalink":"/2019/02/a-heaping-helping","source":"@site/blog/2019-02-07-a-heaping-helping/index.mdx","title":"Allocations in Rust: Dynamic memory","description":"Managing dynamic memory is hard. Some languages assume users will do it themselves (C, C++), and","date":"2019-02-07T12:00:00.000Z","tags":[],"readingTime":5.86,"hasTruncateMarker":true,"authors":[{"name":"Bradlee Speice","socials":{"github":"https://github.com/bspeice"},"key":"bspeice","page":null}],"frontMatter":{"slug":"2019/02/a-heaping-helping","title":"Allocations in Rust: Dynamic memory","date":"2019-02-07T12:00:00.000Z","authors":["bspeice"],"tags":[]},"unlisted":false,"lastUpdatedAt":1731204300000,"prevItem":{"title":"Allocations in Rust: Compiler optimizations","permalink":"/2019/02/08/compiler-optimizations"},"nextItem":{"title":"Allocations in Rust: Fixed memory","permalink":"/2019/02/stacking-up"}}')}}]);