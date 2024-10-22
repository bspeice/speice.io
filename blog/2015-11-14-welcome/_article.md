Title: Welcome, and an algorithm
Date: 2015-11-19
Tags: introduction, trading
Modified: 2015-12-05
Category: Blog


Hello! Glad to meet you. I'm currently a student at Columbia University
studying Financial Engineering, and want to give an overview of the projects
I'm working on!

To start things off, Columbia has been hosting a trading competition that
myself and another partner are competing in. I'm including a notebook of the
algorithm that we're using, just to give a simple overview of a miniature
algorithm.

The competition is scored in 3 areas:

- Total return
- [Sharpe ratio](1)
- Maximum drawdown

Our algorithm uses a basic momentum strategy: in the given list of potential
portfolios, pick the stocks that have been performing well in the past 30
days. Then, optimize for return subject to the drawdown being below a specific
level. We didn't include the Sharpe ratio as a constraint, mostly because
we were a bit late entering the competition.

I'll be updating this post with the results of our algorithm as they come along!

---

**UPDATE 12/5/2015**: Now that the competition has ended, I wanted to update
how the algorithm performed. Unfortunately, it didn't do very well. I'm planning
to make some tweaks over the coming weeks, and do another forward test in January.

- After week 1: Down .1%
- After week 2: Down 1.4%
- After week 3: Flat

And some statistics for all teams participating in the competition:

|                    |        |
|--------------------|--------|
| Max Return         | 74.1%  |
| Min Return         | -97.4% |
| Average Return     | -.1%   |
| Std Dev of Returns | 19.6%  |

---

{% notebook 2015-11-14-welcome.ipynb %}

<script type="text/x-mathjax-config">
MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\(','\)']]}});
</script>
<script async src='https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_CHTML'></script>

[1]: https://en.wikipedia.org/wiki/Sharpe_ratio
