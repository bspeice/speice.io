"use strict";(self.webpackChunkspeice_io=self.webpackChunkspeice_io||[]).push([["302"],{8674:function(e,n,t){t.r(n),t.d(n,{assets:function(){return l},contentTitle:function(){return o},default:function(){return h},frontMatter:function(){return r},metadata:function(){return s},toc:function(){return c}});var s=t(6749),a=t(5893),i=t(65);let r={slug:"2016/03/predicting-santander-customer-happiness",title:"Predicting Santander customer happiness",date:new Date("2016-03-05T12:00:00.000Z"),authors:["bspeice"],tags:[]},o=void 0,l={authorsImageUrls:[void 0]},c=[{value:"Data Exploration",id:"data-exploration",level:2},{value:"Dimensionality Reduction pt. 1 - Binary Classifiers",id:"dimensionality-reduction-pt-1---binary-classifiers",level:3},{value:"Dimensionality Reduction pt. 2 - LDA",id:"dimensionality-reduction-pt-2---lda",level:3},{value:"Summary for Day 1",id:"summary-for-day-1",level:2},{value:"Appendix",id:"appendix",level:2}];function d(e){let n={a:"a",annotation:"annotation",code:"code",h2:"h2",h3:"h3",img:"img",li:"li",math:"math",mi:"mi",mn:"mn",mo:"mo",mrow:"mrow",p:"p",pre:"pre",semantics:"semantics",span:"span",strong:"strong",ul:"ul",...(0,i.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.p,{children:"My first Kaggle competition."}),"\n",(0,a.jsxs)(n.p,{children:["It's time! After embarking on a Machine Learning class this semester, and with a Saturday in which I don't have much planned, I wanted to put this class and training to work. It's my first competition submission. I want to walk you guys through how I'm approaching this problem, because I thought it would be really neat. The competition is Banco Santander's ",(0,a.jsx)(n.a,{href:"https://www.kaggle.com/c/santander-customer-satisfaction",children:"Santander Customer Satisfaction"})," competition. It seemed like an easy enough problem I could actually make decent progress on it."]}),"\n",(0,a.jsx)(n.h2,{id:"data-exploration",children:"Data Exploration"}),"\n",(0,a.jsxs)(n.p,{children:["First up: we need to load our data and do some exploratory work. Because we're going to be using this data for model selection prior to testing, we need to make a further split. I've already gone ahead and done this work, please see the code in the ",(0,a.jsx)(n.a,{href:"#appendix",children:"appendix below"}),"."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:"import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n%matplotlib inline\n\n# Record how long it takes to run the notebook - I'm curious.\nfrom datetime import datetime\nstart = datetime.now()\n\ndataset = pd.read_csv('split_train.csv')\ndataset.index = dataset.ID\nX = dataset.drop(['TARGET', 'ID', 'ID.1'], 1)\ny = dataset.TARGET\n"})}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:"y.unique()\n"})}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"    array([0, 1], dtype=int64)\n"})}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:"len(X.columns)\n"})}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"    369\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Okay, so there are only ",(0,a.jsx)(n.a,{href:"https://www.kaggle.com/c/santander-customer-satisfaction/data",children:"two classes we're predicting"}),": 1 for unsatisfied customers, 0 for satisfied customers. I would have preferred this to be something more like a regression, or predicting multiple classes: maybe the customer isn't the most happy, but is nowhere near closing their accounts. For now though, that's just the data we're working with."]}),"\n",(0,a.jsx)(n.p,{children:"Now, I'd like to make a scatter matrix of everything going on. Unfortunately as noted above, we have 369 different features. There's no way I can graphically make sense of that much data to start with."}),"\n",(0,a.jsx)(n.p,{children:"We're also not told what the data actually represents: Are these survey results? Average time between contact with a customer care person? Frequency of contacting a customer care person? The idea is that I need to reduce the number of dimensions we're predicting across."}),"\n",(0,a.jsx)(n.h3,{id:"dimensionality-reduction-pt-1---binary-classifiers",children:"Dimensionality Reduction pt. 1 - Binary Classifiers"}),"\n",(0,a.jsx)(n.p,{children:"My first attempt to reduce the data dimensionality is to find all the binary classifiers in the dataset (i.e. 0 or 1 values) and see if any of those are good (or anti-good) predictors of the final data."}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:"cols = X.columns\nb_class = []\nfor c in cols:\n    if len(X[c].unique()) == 2:\n        b_class.append(c)\n        \nlen(b_class)\n"})}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"    111\n"})}),"\n",(0,a.jsx)(n.p,{children:"So there are 111 features in the dataset that are a binary label. Let's see if any of them are good at predicting the users satisfaction!"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:'# First we need to `binarize` the data to 0-1; some of the labels are {0, 1},\n# some are {0, 3}, etc.\nfrom sklearn.preprocessing import binarize\nX_bin = binarize(X[b_class])\n\naccuracy = [np.mean(X_bin[:,i] == y) for i in range(0, len(b_class))]\nacc_df = pd.DataFrame({"Accuracy": accuracy}, index=b_class)\nacc_df.describe()\n'})}),"\n",(0,a.jsx)("div",{children:(0,a.jsxs)("table",{children:[(0,a.jsx)("thead",{children:(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{}),(0,a.jsx)("th",{children:"Accuracy"})]})}),(0,a.jsxs)("tbody",{children:[(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{children:"count"}),(0,a.jsx)("td",{children:"111.000000"})]}),(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{children:"mean"}),(0,a.jsx)("td",{children:"0.905159"})]}),(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{children:"std"}),(0,a.jsx)("td",{children:"0.180602"})]}),(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{children:"min"}),(0,a.jsx)("td",{children:"0.043598"})]}),(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{children:"25%"}),(0,a.jsx)("td",{children:"0.937329"})]}),(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{children:"50%"}),(0,a.jsx)("td",{children:"0.959372"})]}),(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{children:"75%"}),(0,a.jsx)("td",{children:"0.960837"})]}),(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{children:"max"}),(0,a.jsx)("td",{children:"0.960837"})]})]})]})}),"\n",(0,a.jsx)(n.p,{children:"Wow! Looks like we've got some incredibly predictive features! So much so that we should be a bit concerned. My initial guess for what's happening is that we have a sparsity issue: so many of the values are 0, and these likely happen to line up with satisfied customers."}),"\n",(0,a.jsx)(n.p,{children:"So the question we must now answer, which I likely should have asked long before now: What exactly is the distribution of un/satisfied customers?"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:'unsat = y[y == 1].count()\nprint("Satisfied customers: {}; Unsatisfied customers: {}".format(len(y) - unsat, unsat))\nnaive_guess = np.mean(y == np.zeros(len(y)))\nprint("Naive guess accuracy: {}".format(naive_guess))\n'})}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"    Satisfied customers: 51131; Unsatisfied customers: 2083\n    Naive guess accuracy: 0.9608561656706882\n"})}),"\n",(0,a.jsx)(n.p,{children:"This is a bit discouraging. A naive guess of \"always satisfied\" performs as well as our best individual binary classifier. What this tells me then, is that these data columns aren't incredibly helpful in prediction. I'd be interested in a polynomial expansion of this data-set, but for now, that's more computation than I want to take on."}),"\n",(0,a.jsx)(n.h3,{id:"dimensionality-reduction-pt-2---lda",children:"Dimensionality Reduction pt. 2 - LDA"}),"\n",(0,a.jsx)(n.p,{children:"Knowing that our naive guess performs so well is a blessing and a curse:"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsx)(n.li,{children:'Curse: The threshold for performance is incredibly high: We can only "improve" over the naive guess by 4%'}),"\n",(0,a.jsx)(n.li,{children:"Blessing: All the binary classification features we just discovered are worthless on their own. We can throw them out and reduce the data dimensionality from 369 to 111."}),"\n"]}),"\n",(0,a.jsx)(n.p,{children:"Now, in removing these features from the dataset, I'm not saying that there is no \"information\" contained within them. There might be. But the only way we'd know is through a polynomial expansion, and I'm not going to take that on within this post."}),"\n",(0,a.jsxs)(n.p,{children:['My initial thought for a "next guess" is to use the ',(0,a.jsx)(n.a,{href:"http://scikit-learn.org/stable/modules/lda_qda.html",children:"LDA"})," model for dimensionality reduction. However, it can only reduce dimensions to ",(0,a.jsxs)(n.span,{className:"katex",children:[(0,a.jsx)(n.span,{className:"katex-mathml",children:(0,a.jsx)(n.math,{xmlns:"http://www.w3.org/1998/Math/MathML",children:(0,a.jsxs)(n.semantics,{children:[(0,a.jsxs)(n.mrow,{children:[(0,a.jsx)(n.mn,{children:"1"}),(0,a.jsx)(n.mo,{children:"\u2212"}),(0,a.jsx)(n.mi,{children:"p"})]}),(0,a.jsx)(n.annotation,{encoding:"application/x-tex",children:"1 - p"})]})})}),(0,a.jsxs)(n.span,{className:"katex-html","aria-hidden":"true",children:[(0,a.jsxs)(n.span,{className:"base",children:[(0,a.jsx)(n.span,{className:"strut",style:{height:"0.7278em",verticalAlign:"-0.0833em"}}),(0,a.jsx)(n.span,{className:"mord",children:"1"}),(0,a.jsx)(n.span,{className:"mspace",style:{marginRight:"0.2222em"}}),(0,a.jsx)(n.span,{className:"mbin",children:"\u2212"}),(0,a.jsx)(n.span,{className:"mspace",style:{marginRight:"0.2222em"}})]}),(0,a.jsxs)(n.span,{className:"base",children:[(0,a.jsx)(n.span,{className:"strut",style:{height:"0.625em",verticalAlign:"-0.1944em"}}),(0,a.jsx)(n.span,{className:"mord mathnormal",children:"p"})]})]})]}),", with ",(0,a.jsxs)(n.span,{className:"katex",children:[(0,a.jsx)(n.span,{className:"katex-mathml",children:(0,a.jsx)(n.math,{xmlns:"http://www.w3.org/1998/Math/MathML",children:(0,a.jsxs)(n.semantics,{children:[(0,a.jsx)(n.mrow,{children:(0,a.jsx)(n.mi,{children:"p"})}),(0,a.jsx)(n.annotation,{encoding:"application/x-tex",children:"p"})]})})}),(0,a.jsx)(n.span,{className:"katex-html","aria-hidden":"true",children:(0,a.jsxs)(n.span,{className:"base",children:[(0,a.jsx)(n.span,{className:"strut",style:{height:"0.625em",verticalAlign:"-0.1944em"}}),(0,a.jsx)(n.span,{className:"mord mathnormal",children:"p"})]})})]})," being the number of classes. Since this is a binary classification, every LDA model that I try will have dimensionality one; when I actually try this, the predictor ends up being slightly less accurate than the naive guess."]}),"\n",(0,a.jsxs)(n.p,{children:["Instead, let's take a different approach to dimensionality reduction: ",(0,a.jsx)(n.a,{href:"http://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html",children:"principle components analysis"}),". This allows us to perform the dimensionality reduction without worrying about the number of classes. Then, we'll use a ",(0,a.jsx)(n.a,{href:"http://scikit-learn.org/stable/modules/naive_bayes.html#gaussian-naive-bayes",children:"Gaussian Naive Bayes"})," model to actually do the prediction. This model is chosen simply because it doesn't take a long time to fit and compute; because PCA will take so long, I just want a prediction at the end of this. We can worry about using a more sophisticated LDA/QDA/SVM model later."]}),"\n",(0,a.jsx)(n.p,{children:"Now into the actual process: We're going to test out PCA dimensionality reduction from 1 - 20 dimensions, and then predict using a Gaussian Naive Bayes model. The 20 dimensions upper limit was selected because the accuracy never improves after you get beyond that (I found out by running it myself). Hopefully, we'll find that we can create a model better than the naive guess."}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:'from sklearn.naive_bayes import GaussianNB\nfrom sklearn.decomposition import PCA\n\nX_no_bin = X.drop(b_class, 1)\n\ndef evaluate_gnb(dims):\n    pca = PCA(n_components=dims)\n    X_xform = pca.fit_transform(X_no_bin)\n    \n    gnb = GaussianNB()\n    gnb.fit(X_xform, y)\n    return gnb.score(X_xform, y)\n\ndim_range = np.arange(1, 21)\nplt.plot(dim_range, [evaluate_gnb(dim) for dim in dim_range], label="Gaussian NB Accuracy")\nplt.axhline(naive_guess, label="Naive Guess", c=\'k\')\nplt.axhline(1 - naive_guess, label="Inverse Naive Guess", c=\'k\')\nplt.gcf().set_size_inches(12, 6)\nplt.legend();\n'})}),"\n",(0,a.jsx)(n.p,{children:(0,a.jsx)(n.img,{alt:"png",src:t(9034).Z+"",width:"710",height:"368"})}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"sigh..."})," After all the effort and computational power, we're still at square one: we have yet to beat out the naive guess threshold. With PCA in play we end up performing terribly, but not terribly enough that we can guess against ourselves."]}),"\n",(0,a.jsx)(n.p,{children:"Let's try one last-ditch attempt using the entire data set:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:'def evaluate_gnb_full(dims):\n    pca = PCA(n_components=dims)\n    X_xform = pca.fit_transform(X)\n    \n    gnb = GaussianNB()\n    gnb.fit(X_xform, y)\n    return gnb.score(X_xform, y)\n\ndim_range = np.arange(1, 21)\nplt.plot(dim_range, [evaluate_gnb(dim) for dim in dim_range], label="Gaussian NB Accuracy")\nplt.axhline(naive_guess, label="Naive Guess", c=\'k\')\nplt.axhline(1 - naive_guess, label="Inverse Naive Guess", c=\'k\')\nplt.gcf().set_size_inches(12, 6)\nplt.legend();\n'})}),"\n",(0,a.jsx)(n.p,{children:(0,a.jsx)(n.img,{alt:"png",src:t(3448).Z+"",width:"710",height:"368"})}),"\n",(0,a.jsx)(n.p,{children:"Nothing. It is interesting to note that the graphs are almost exactly the same: This would imply again that the variables we removed earlier (all the binary classifiers) indeed have almost no predictive power. It seems this problem is high-dimensional, but with almost no data that can actually inform our decisions."}),"\n",(0,a.jsx)(n.h2,{id:"summary-for-day-1",children:"Summary for Day 1"}),"\n",(0,a.jsxs)(n.p,{children:["After spending a couple hours with this dataset, there seems to be a fundamental issue in play: We have very high-dimensional data, and it has no bearing on our ability to actually predict customer satisfaction. This can be a huge issue: it implies that ",(0,a.jsx)(n.strong,{children:"no matter what model we use, we fundamentally can't perform well."})," I'm sure most of this is because I'm not an experienced data scientist. Even so, we have yet to develop a strategy that can actually beat out the village idiot; ",(0,a.jsx)(n.strong,{children:"so far, the bank is best off just assuming all its customers are satisfied."})," Hopefully more to come soon."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:'end = datetime.now()\nprint("Running time: {}".format(end - start))\n'})}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"    Running time: 0:00:58.715714\n"})}),"\n",(0,a.jsx)(n.h2,{id:"appendix",children:"Appendix"}),"\n",(0,a.jsx)(n.p,{children:"Code used to split the initial training data:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:"from sklearn.cross_validation import train_test_split\ndata = pd.read_csv('train.csv')\ndata.index = data.ID\n\ndata_train, data_validate = train_test_split(\n    data, train_size=.7)\n\ndata_train.to_csv('split_train.csv')\ndata_validate.to_csv('split_validate.csv')\n"})})]})}function h(e={}){let{wrapper:n}={...(0,i.a)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(d,{...e})}):d(e)}},9034:function(e,n,t){t.d(n,{Z:function(){return s}});let s=t.p+"assets/images/_notebook_11_0-2d0fe64b876b1c32a095f2d74b128f3c.png"},3448:function(e,n,t){t.d(n,{Z:function(){return s}});let s=t.p+"assets/images/_notebook_13_0-2d0fe64b876b1c32a095f2d74b128f3c.png"},65:function(e,n,t){t.d(n,{Z:function(){return o},a:function(){return r}});var s=t(7294);let a={},i=s.createContext(a);function r(e){let n=s.useContext(i);return s.useMemo(function(){return"function"==typeof e?e(n):{...n,...e}},[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),s.createElement(i.Provider,{value:n},e.children)}},6749:function(e){e.exports=JSON.parse('{"permalink":"/2016/03/predicting-santander-customer-happiness","source":"@site/blog/2016-03-05-predicting-santander-customer-happiness/index.mdx","title":"Predicting Santander customer happiness","description":"My first Kaggle competition.","date":"2016-03-05T12:00:00.000Z","tags":[],"readingTime":6.95,"hasTruncateMarker":true,"authors":[{"name":"Bradlee Speice","socials":{"github":"https://github.com/bspeice"},"key":"bspeice","page":null}],"frontMatter":{"slug":"2016/03/predicting-santander-customer-happiness","title":"Predicting Santander customer happiness","date":"2016-03-05T12:00:00.000Z","authors":["bspeice"],"tags":[]},"unlisted":false,"lastUpdatedAt":1730863976000,"prevItem":{"title":"Tweet like me","permalink":"/2016/03/tweet-like-me"},"nextItem":{"title":"Profitability using the investment formula","permalink":"/2016/02/profitability-using-the-investment-formula"}}')}}]);