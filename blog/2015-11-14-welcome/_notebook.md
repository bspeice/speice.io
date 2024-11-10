# Trading Competition Optimization

### Goal: Max return given maximum Sharpe and Drawdown


```python
from IPython.display import display
import Quandl
from datetime import datetime, timedelta

tickers = ['XOM', 'CVX', 'CLB', 'OXY', 'SLB']
market_ticker = 'GOOG/NYSE_VOO'
lookback = 30
d_col = 'Close'

data = {tick: Quandl.get('YAHOO/{}'.format(tick))[-lookback:] for tick in tickers}
market = Quandl.get(market_ticker)
```

# Calculating the Return
We first want to know how much each ticker returned over the prior period.


```python
returns = {tick: data[tick][d_col].pct_change() for tick in tickers}

display({tick: returns[tick].mean() for tick in tickers})
```


    {'CLB': -0.0016320202164526894,
     'CVX': 0.0010319531629488911,
     'OXY': 0.00093418904454400551,
     'SLB': 0.00098431254720448159,
     'XOM': 0.00044165797556096868}


# Calculating the Sharpe ratio
Sharpe: ${R - R_M \over \sigma}$

We use the average return over the lookback period, minus the market average return, over the ticker standard deviation to calculate the Sharpe. Shorting a stock turns a negative Sharpe positive.


```python
market_returns = market.pct_change()

sharpe = lambda ret: (ret.mean() - market_returns[d_col].mean()) / ret.std()
sharpes = {tick: sharpe(returns[tick]) for tick in tickers}

display(sharpes)
```


    {'CLB': -0.10578734457846127,
     'CVX': 0.027303529817677398,
     'OXY': 0.022622210057414487,
     'SLB': 0.026950946344858676,
     'XOM': -0.0053519259698605499}


# Calculating the drawdown
This one is easy - what is the maximum daily change over the lookback period? That is, because we will allow short positions, we are not concerned strictly with maximum downturn, but in general, what is the largest 1-day change?


```python
drawdown = lambda ret: ret.abs().max()
drawdowns = {tick: drawdown(returns[tick]) for tick in tickers}

display(drawdowns)
```


    {'CLB': 0.043551495607375035,
     'CVX': 0.044894389686214398,
     'OXY': 0.051424517867144637,
     'SLB': 0.034774627850375328,
     'XOM': 0.035851524605672758}


# Performing the optimization

$\begin{align}
max\ \ & \mu \cdot \omega\\
s.t.\ \ & \vec{1} \omega = 1\\
& \vec{S} \omega \ge s\\
& \vec{D} \cdot | \omega | \le d\\
& \left|\omega\right| \le l\\
\end{align}$

We want to maximize average return subject to having a full portfolio, Sharpe above a specific level, drawdown below a level, and leverage not too high - that is, don't have huge long/short positions.


```python
import numpy as np
from scipy.optimize import minimize

#sharpe_limit = .1
drawdown_limit = .05
leverage = 250

# Use the map so we can guarantee we maintain the correct order
# sharpe_a = np.array(list(map(lambda tick: sharpes[tick], tickers))) * -1 # So we can write as upper-bound
dd_a = np.array(list(map(lambda tick: drawdowns[tick], tickers)))
returns_a = np.array(list(map(lambda tick: returns[tick].mean(), tickers))) # Because minimizing

meets_sharpe = lambda x: sum(abs(x) * sharpe_a) - sharpe_limit
def meets_dd(x):
    portfolio = sum(abs(x))
    if portfolio < .1:
        # If there are no stocks in the portfolio,
        # we can accidentally induce division by 0,
        # or division by something small enough to cause infinity
        return 0
    
    return drawdown_limit - sum(abs(x) * dd_a) / sum(abs(x))

is_portfolio = lambda x: sum(x) - 1

def within_leverage(x):
    return leverage - sum(abs(x))

objective = lambda x: sum(x * returns_a) * -1 # Because we're minimizing
bounds = ((None, None),) * len(tickers)
x = np.zeros(len(tickers))

constraints = [
    {
        'type': 'eq',
        'fun': is_portfolio
    }, {
        'type': 'ineq',
        'fun': within_leverage
    #}, {
    #    'type': 'ineq',
    #    'fun': meets_sharpe
    }, {
        'type': 'ineq',
        'fun': meets_dd
    }
]

optimal = minimize(objective, x, bounds=bounds, constraints=constraints,
                  options={'maxiter': 500})

# Optimization time!
display(optimal.message)

display("Holdings: {}".format(list(zip(tickers, optimal.x))))

expected_return = optimal.fun * -100  # multiply by -100 to scale, and compensate for minimizing
display("Expected Return: {:.3f}%".format(expected_return))

expected_drawdown = sum(abs(optimal.x) * dd_a) / sum(abs(optimal.x)) * 100
display("Expected Max Drawdown: {0:.2f}%".format(expected_drawdown))

# TODO: Calculate expected Sharpe
```


    'Optimization terminated successfully.'



    "Holdings: [('XOM', 5.8337945679814904), ('CVX', 42.935064321851307), ('CLB', -124.5), ('OXY', 36.790387773552119), ('SLB', 39.940753336615096)]"



    'Expected Return: 32.375%'



    'Expected Max Drawdown: 4.34%'

