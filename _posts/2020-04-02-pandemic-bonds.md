---
layout: post
title: "Pandemic Bonds"
description: "Derivatives for Great Good"
category: 
tags: [python]
---

Everyone's bored at home right now, so how about we play a game? The rules are simple:

- You give me $1 as a wager
- I will roll a fair die
    - If the roll is 1-5, you get the wager back
    - If the roll is a 6, I keep the wager

Want to play?

# Making the Game Fair

Nobody in their right mind would want to play this game; it's incredibly unfair! The dealer has no money at risk and the best a player can do is win back the money they started with. There's nowhere to go but down. In math speak, we "expect" that players will lose money playing this game. There's a simple way to make the game fair, but we need to talk about some probability to do so.

First, let's alter the structure of this game a bit:

- You give me $1 as a wager
- I will roll a fair die
    - If the roll is 1-5, I will pay back the original wager plus some amount \\(N\\)
    - If the roll is a 6, I keep the wager

This time around there's a potential for players to actually win money! Specifically, there's a 5 in 6 (approx. 83%) chance that you'll come out ahead. That just leaves one question: what should the value of \\(N\\) be?

To figure that out, we need to quickly introduce some probability notation. We'll say that \\(P(1)\\) is the probability that the dealer rolls a 1. Because this is a fair die, \\(P(1) = 1/6\\). Similarly, \\(P(2)\\) is the probability that the dealer rolls a 2, and so on.

With that out of the way, we can write out how much money we "expect" players of this game to win:

\\((N)(P(1) + P(2) + ... + P(5)) + (-1)(P(6))\\)

In simple English, the above expression lists out all possible results, how much you win in each, and the probability that each happens. If the dealer rolls a 1, the player wins \\( N \\). Same thing for 2 through 5. But if the dealer rolls a 6, the player loses all the money they started with.

After some simplification, the expected player winnings are:

\\( 5N/6 - 1/6 \\)

We can also write out what the dealer "expects" to win by playing the game:

\\( (-N) (P(1) + P(2) + ... + P(5)) + (1) P(6) \\)

Similar to the player, this lists all possible results and how much the dealer wins. If the dealer rolls a 1, they lose \\( N \\). Same thing for 2 through 5. But if the dealer rolls a 6, they win the wager.

After simplification:

\\( -5N / 6 + 1/6\\)

Finally, this game will be fair if we make sure that both the player and the dealer expect to win the same amounts. This allows us to solve for \\( N \\):

\\( 5N/6 - 1/6 = -5N / 6 + 1/6 \\)

\\( 10N / 6 = 2/6 \\)

\\( N = 2/10 = .20 \\)

Finally, we can write out a fair version of the game as follows:

- You give me $1 as a wager
- I will roll a fair die
    - If the roll is 1-5, I will pay back $1.20
    - If the roll is a 6, I keep the wager

Assuming the die is fair, and that we play this game for a very long (infinite) time, players of this game should expect to neither gain nor lose money.

# Pandemic Financing

With that out of the way, what the heck are pandemic bonds?

The [Pandemic Emergency Financing Facility](https://en.wikipedia.org/wiki/Pandemic_Emergency_Financing_Facility)(PEF), also known as a "pandemic bond", is just a special financial contract. The basic structure of the bond is simple:

- People give the World Bank money.
- If there is no pandemic:
    - Every month, the World Bank pays (a lot of) interest on that money
    - On July 15, 2020, all the money is given back
- If there is a pandemic:
    - No further interest is paid on the money
    - The World Bank gets to keep the money

If you're interested in the specifics, check out the [bond prospectus](http://pubdocs.worldbank.org/en/882831509568634367/PEF-Final-Prospectus-PEF.pdf) for interest rates, a definition of "pandemic", and so much more.

But the most interesting thing in this contract is how *both sides (lenders and the World Bank) benefit*.

We'll look at this from the World Bank's perspective first. The World Bank is concerned about [the possibility of a pandemic](https://www.youtube.com/watch?v=6Af6b_wyiwI). 

If you're lending money to the World Bank, this is a potentially great investment opportunity. Sure, there's a potential you lose everything, but *assuming a high enough interest rate*, this is a hard deal to pass up.