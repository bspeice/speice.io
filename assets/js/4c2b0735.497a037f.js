"use strict";(self.webpackChunkspeice_io=self.webpackChunkspeice_io||[]).push([["4718"],{5960:function(e,n,t){t.r(n),t.d(n,{assets:function(){return d},contentTitle:function(){return o},default:function(){return h},frontMatter:function(){return i},metadata:function(){return a},toc:function(){return l}});var a=t(173),r=t(5893),s=t(65);let i={slug:"2016/06/event-studies-and-earnings-releases",title:"Event studies and earnings releases",date:new Date("2016-06-08T12:00:00.000Z"),authors:["bspeice"],tags:[]},o=void 0,d={authorsImageUrls:[void 0]},l=[{value:"The Market Just Knew",id:"the-market-just-knew",level:2},{value:"Formulating the Question",id:"formulating-the-question",level:2},{value:"Event Studies",id:"event-studies",level:2},{value:"Event Type 1: Trending down over the past N days",id:"event-type-1-trending-down-over-the-past-n-days",level:2},{value:"Event Type 2: Trending up for N days",id:"event-type-2-trending-up-for-n-days",level:2},{value:"Conclusion and Summary",id:"conclusion-and-summary",level:2}];function c(e){let n={code:"code",em:"em",h1:"h1",h2:"h2",img:"img",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,s.a)(),...e.components},{Details:a}=n;return!a&&function(e,n){throw Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("Details",!0),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.p,{children:"Or, being suspicious of market insiders."}),"\n",(0,r.jsx)(n.h2,{id:"the-market-just-knew",children:"The Market Just Knew"}),"\n",(0,r.jsx)(n.p,{children:"I recently saw two examples of stock charts that have kept me thinking for a while. And now that the semester is complete, I finally have enough time to really look at them and give them the treatment they deserve. The first is good old Apple:"}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"from secrets import QUANDL_KEY\nimport matplotlib.pyplot as plt\nfrom matplotlib.dates import date2num\nfrom matplotlib.finance import candlestick_ohlc\nfrom matplotlib.dates import DateFormatter, WeekdayLocator,\\\n    DayLocator, MONDAY\nimport quandl\nfrom datetime import datetime\nimport pandas as pd\n%matplotlib inline\n\ndef fetch_ticker(ticker, start, end):\n    # Quandl is currently giving me issues with returning\n    # the entire dataset and not slicing server-side.\n    # So instead, we'll do it client-side!\n    q_format = '%Y-%m-%d'\n    ticker_data = quandl.get('YAHOO/' + ticker,\n                             start_date=start.strftime(q_format),\n                             end_date=end.strftime(q_format),\n                             authtoken=QUANDL_KEY)\n    return ticker_data\n\ndef ohlc_dataframe(data, ax=None):\n    # Much of this code re-used from:\n    # http://matplotlib.org/examples/pylab_examples/finance_demo.html\n    if ax is None:\n        f, ax = plt.subplots()\n    \n    vals = [(date2num(date), *(data.loc[date]))\n            for date in data.index]\n    candlestick_ohlc(ax, vals)\n    \n    mondays = WeekdayLocator(MONDAY)\n    alldays = DayLocator()\n    weekFormatter = DateFormatter('%b %d')\n    ax.xaxis.set_major_locator(mondays)\n    ax.xaxis.set_minor_locator(alldays)\n    ax.xaxis.set_major_formatter(weekFormatter)\n    return ax\n"})})]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"AAPL = fetch_ticker('AAPL', datetime(2016, 3, 1), datetime(2016, 5, 1))\nax = ohlc_dataframe(AAPL)\nplt.vlines(date2num(datetime(2016, 4, 26, 12)),\n           ax.get_ylim()[0], ax.get_ylim()[1],\n           color='b',\n          label='Earnings Release')\nplt.legend(loc=3)\nplt.title(\"Apple Price 3/1/2016 - 5/1/2016\");\n"})}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(8409).Z+"",width:"372",height:"266"})}),"\n",(0,r.jsx)(n.p,{children:"The second chart is from Facebook:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"FB = fetch_ticker('FB', datetime(2016, 3, 1), datetime(2016, 5, 5))\nax = ohlc_dataframe(FB)\nplt.vlines(date2num(datetime(2016, 4, 27, 12)),\n           ax.get_ylim()[0], ax.get_ylim()[1],\n           color='b', label='Earnings Release')\nplt.title('Facebook Price 3/5/2016 - 5/5/2016')\nplt.legend(loc=2);\n"})}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(4400).Z+"",width:"374",height:"266"})}),"\n",(0,r.jsx)(n.p,{children:"These two charts demonstrate two very specific phonomena: how the market prepares for earnings releases. Let's look at those charts again, but with some extra information. As we're about the see, the market \"knew\" in advance that Apple was going to perform poorly. The market expected that Facebook was going to perform poorly, and instead shot the lights out. Let's see that trend in action:"}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"def plot_hilo(ax, start, end, data):\n    ax.plot([date2num(start), date2num(end)],\n            [data.loc[start]['High'], data.loc[end]['High']],\n            color='b')\n    ax.plot([date2num(start), date2num(end)],\n            [data.loc[start]['Low'], data.loc[end]['Low']],\n            color='b')\n\nf, axarr = plt.subplots(1, 2)\n\nax_aapl = axarr[0]\nax_fb = axarr[1]\n\n# Plot the AAPL trend up and down\nohlc_dataframe(AAPL, ax=ax_aapl)\nplot_hilo(ax_aapl, datetime(2016, 3, 1), datetime(2016, 4, 15), AAPL)\nplot_hilo(ax_aapl, datetime(2016, 4, 18), datetime(2016, 4, 26), AAPL)\nax_aapl.vlines(date2num(datetime(2016, 4, 26, 12)),\n               ax_aapl.get_ylim()[0], ax_aapl.get_ylim()[1],\n               color='g', label='Earnings Release')\nax_aapl.legend(loc=2)\nax_aapl.set_title('AAPL Price History')\n\n# Plot the FB trend down and up\nohlc_dataframe(FB, ax=ax_fb)\nplot_hilo(ax_fb, datetime(2016, 3, 30), datetime(2016, 4, 27), FB)\nplot_hilo(ax_fb, datetime(2016, 4, 28), datetime(2016, 5, 5), FB)\nax_fb.vlines(date2num(datetime(2016, 4, 27, 12)),\n             ax_fb.get_ylim()[0], ax_fb.get_ylim()[1],\n             color='g', label='Earnings Release')\nax_fb.legend(loc=2)\nax_fb.set_title('FB Price History')\n\nf.set_size_inches(18, 6)\n"})})]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(8475).Z+"",width:"1041",height:"378"})}),"\n",(0,r.jsx)(n.p,{children:"As we can see above, the market broke a prevailing trend on Apple in order to go down, and ultimately predict the earnings release. For Facebook, the opposite happened. While the trend was down, the earnings were fantastic and the market corrected itself much higher."}),"\n",(0,r.jsx)(n.h2,{id:"formulating-the-question",children:"Formulating the Question"}),"\n",(0,r.jsx)(n.p,{children:"While these are two specific examples, there are plenty of other examples you could cite one way or another. Even if the preponderance of evidence shows that the market correctly predicts earnings releases, we need not accuse people of collusion; for a company like Apple with many suppliers we can generally forecast how Apple has done based on those same suppliers."}),"\n",(0,r.jsxs)(n.p,{children:["The question then, is this: ",(0,r.jsx)(n.strong,{children:"how well does the market predict the earnings releases?"})," It's an incredibly broad question that I want to disect in a couple of different ways:"]}),"\n",(0,r.jsxs)(n.ol,{children:["\n",(0,r.jsx)(n.li,{children:"Given a stock that has been trending down over the past N days before an earnings release, how likely does it continue downward after the release?"}),"\n",(0,r.jsx)(n.li,{children:"Given a stock trending up, how likely does it continue up?"}),"\n",(0,r.jsx)(n.li,{children:"Is there a difference in accuracy between large- and small-cap stocks?"}),"\n",(0,r.jsx)(n.li,{children:"How often, and for how long, do markets trend before an earnings release?"}),"\n"]}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.strong,{children:"I want to especially thank Alejandro Saltiel for helping me retrieve the data."})," He's great. And now for all of the interesting bits."]}),"\n",(0,r.jsx)(n.h2,{id:"event-studies",children:"Event Studies"}),"\n",(0,r.jsx)(n.p,{children:"Before we go too much further, I want to introduce the actual event study. Each chart intends to capture a lot of information and present an easy-to-understand pattern:"}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"import numpy as np\nimport pandas as pd\nfrom pandas.tseries.holiday import USFederalHolidayCalendar\nfrom pandas.tseries.offsets import CustomBusinessDay\nfrom datetime import datetime, timedelta\n\n# If you remove rules, it removes them from *all* calendars\n# To ensure we don't pop rules we don't want to, first make\n# sure to fully copy the object\ntrade_calendar = USFederalHolidayCalendar()\ntrade_calendar.rules.pop(6) # Remove Columbus day\ntrade_calendar.rules.pop(7) # Remove Veteran's day\nTradeDay = lambda days: CustomBusinessDay(days, calendar=trade_calendar)\n\ndef plot_study(array):\n    # Given a 2-d array, we assume the event happens at index `lookback`,\n    # and create all of our summary statistics from there.\n    lookback = int((array.shape[1] - 1) / 2)\n    norm_factor = np.repeat(array[:,lookback].reshape(-1, 1), array.shape[1], axis=1)\n    centered_data = array / norm_factor - 1\n    lookforward = centered_data.shape[1] - lookback\n    means = centered_data.mean(axis=0)\n    lookforward_data = centered_data[:,lookforward:]\n    std_dev = np.hstack([0, lookforward_data.std(axis=0)])\n    maxes = lookforward_data.max(axis=0)\n    mins = lookforward_data.min(axis=0)\n    \n    f, axarr = plt.subplots(1, 2)\n    range_begin = -lookback\n    range_end = lookforward\n    axarr[0].plot(range(range_begin, range_end), means)\n    axarr[1].plot(range(range_begin, range_end), means)\n    axarr[0].fill_between(range(0, range_end),\n                     means[-lookforward:] + std_dev,\n                     means[-lookforward:] - std_dev,\n                    alpha=.5, label=\"$\\pm$ 1 s.d.\")\n    axarr[1].fill_between(range(0, range_end),\n                     means[-lookforward:] + std_dev,\n                     means[-lookforward:] - std_dev,\n                    alpha=.5, label=\"$\\pm$ 1 s.d.\")\n    \n    max_err = maxes - means[-lookforward+1:]\n    min_err = means[-lookforward+1:] - mins\n    axarr[0].errorbar(range(1, range_end),\n                  means[-lookforward+1:],\n                  yerr=[min_err, max_err], label='Max & Min')\n    axarr[0].legend(loc=2)\n    axarr[1].legend(loc=2)\n    \n    axarr[0].set_xlim((-lookback-1, lookback+1))\n    axarr[1].set_xlim((-lookback-1, lookback+1))\n    \ndef plot_study_small(array):\n    # Given a 2-d array, we assume the event happens at index `lookback`,\n    # and create all of our summary statistics from there.\n    lookback = int((array.shape[1] - 1) / 2)\n    norm_factor = np.repeat(array[:,lookback].reshape(-1, 1), array.shape[1], axis=1)\n    centered_data = array / norm_factor - 1\n    lookforward = centered_data.shape[1] - lookback\n    means = centered_data.mean(axis=0)\n    lookforward_data = centered_data[:,lookforward:]\n    std_dev = np.hstack([0, lookforward_data.std(axis=0)])\n    maxes = lookforward_data.max(axis=0)\n    mins = lookforward_data.min(axis=0)\n    \n    range_begin = -lookback\n    range_end = lookforward\n    plt.plot(range(range_begin, range_end), means)\n    plt.fill_between(range(0, range_end),\n                     means[-lookforward:] + std_dev,\n                     means[-lookforward:] - std_dev,\n                    alpha=.5, label=\"$\\pm$ 1 s.d.\")\n    \n    max_err = maxes - means[-lookforward+1:]\n    min_err = means[-lookforward+1:] - mins\n    plt.errorbar(range(1, range_end),\n                  means[-lookforward+1:],\n                  yerr=[min_err, max_err], label='Max & Min')\n    plt.legend(loc=2)\n    plt.xlim((-lookback-1, lookback+1))\n    \ndef fetch_event_data(ticker, events, horizon=5):\n    # Use horizon+1 to account for including the day of the event,\n    # and half-open interval - that is, for a horizon of 5,\n    # we should be including 11 events. Additionally, using the\n    # CustomBusinessDay means we automatically handle issues if\n    # for example a company reports Friday afternoon - the date\n    # calculator will turn this into a \"Saturday\" release, but\n    # we effectively shift that to Monday with the logic below.\n    td_back = TradeDay(horizon+1)\n    td_forward = TradeDay(horizon+1)\n    \n    start_date = min(events) - td_back\n    end_date = max(events) + td_forward\n    total_data = fetch_ticker(ticker, start_date, end_date)\n    event_data = [total_data.ix[event-td_back:event+td_forward]\\\n                      [0:horizon*2+1]\\\n                      ['Adjusted Close']\n                  for event in events]\n    return np.array(event_data)\n"})})]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"# Generate a couple of random events\n\nevent_dates = [datetime(2016, 5, 27) - timedelta(days=1) - TradeDay(x*20) for x in range(1, 40)]\ndata = fetch_event_data('CELG', event_dates)\nplot_study_small(data)\nplt.legend(loc=3)\nplt.gcf().set_size_inches(12, 6);\n\n\nplt.annotate('Mean price for days leading up to each event',\n             (-5, -.01), (-4.5, .025),\n             arrowprops=dict(facecolor='black', shrink=0.05))\nplt.annotate('', (-.1, .005), (-.5, .02),\n             arrowprops={'facecolor': 'black', 'shrink': .05})\nplt.annotate('$\\pm$ 1 std. dev. each day', (5, .055), (2.5, .085),\n            arrowprops={'facecolor': 'black', 'shrink': .05})\nplt.annotate('Min/Max each day', (.9, -.07), (-1, -.1),\n            arrowprops={'facecolor': 'black', 'shrink': .05});\n"})}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(7134).Z+"",width:"721",height:"368"})}),"\n",(0,r.jsx)(n.p,{children:"And as a quick textual explanation as well:"}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"The blue line represents the mean price for each day, represented as a percentage of the price on the '0-day'. For example, if we defined an 'event' as whenever the stock price dropped for three days, we would see a decreasing blue line to the left of the 0-day."}),"\n",(0,r.jsx)(n.li,{children:"The blue shaded area represents one standard deviation above and below the mean price for each day following an event. This is intended to give us an idea of what the stock price does in general following an event."}),"\n",(0,r.jsx)(n.li,{children:"The green bars are the minimum and maximum price for each day following an event. This instructs us as to how much it's possible for the stock to move."}),"\n"]}),"\n",(0,r.jsx)(n.h2,{id:"event-type-1-trending-down-over-the-past-n-days",children:"Event Type 1: Trending down over the past N days"}),"\n",(0,r.jsxs)(n.p,{children:["The first type of event I want to study is how stocks perform when they've been trending down over the past couple of days prior to a release. However, we need to clarify what exactly is meant by \"trending down.\" To do so, we'll use the following metric: ",(0,r.jsx)(n.strong,{children:"the midpoint between each day's opening and closing price goes down over a period of N days"}),"."]}),"\n",(0,r.jsx)(n.p,{children:"It's probably helpful to have an example:"}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"f, axarr = plt.subplots(1, 2)\nf.set_size_inches(18, 6)\n\nFB_plot = axarr[0]\nohlc_dataframe(FB[datetime(2016, 4, 18):], FB_plot)\n\nFB_truncated = FB[datetime(2016, 4, 18):datetime(2016, 4, 27)]\nmidpoint = FB_truncated['Open']/2 + FB_truncated['Close']/2\nFB_plot.plot(FB_truncated.index, midpoint, label='Midpoint')\nFB_plot.vlines(date2num(datetime(2016, 4, 27, 12)),\n               ax_fb.get_ylim()[0], ax_fb.get_ylim()[1],\n               color='g', label='Earnings Release')\nFB_plot.legend(loc=2)\nFB_plot.set_title('FB Midpoint Plot')\n\nAAPL_plot = axarr[1]\nohlc_dataframe(AAPL[datetime(2016, 4, 10):], AAPL_plot)\nAAPL_truncated = AAPL[datetime(2016, 4, 10):datetime(2016, 4, 26)]\nmidpoint = AAPL_truncated['Open']/2 + AAPL_truncated['Close']/2\nAAPL_plot.plot(AAPL_truncated.index, midpoint, label='Midpoint')\nAAPL_plot.vlines(date2num(datetime(2016, 4, 26, 12)),\n                 ax_aapl.get_ylim()[0], ax_aapl.get_ylim()[1],\n                 color='g', label='Earnings Release')\nAAPL_plot.legend(loc=3)\nAAPL_plot.set_title('AAPL Midpoint Plot');\n"})})]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(6403).Z+"",width:"1041",height:"378"})}),"\n",(0,r.jsx)(n.p,{children:"Given these charts, we can see that FB was trending down for the four days preceding the earnings release, and AAPL was trending down for a whopping 8 days (we don't count the peak day). This will define the methodology that we will use for the study."}),"\n",(0,r.jsx)(n.p,{children:"So what are the results? For a given horizon, how well does the market actually perform?"}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"# Read in the events for each stock;\n# The file was created using the first code block in the Appendix\nimport yaml\nfrom dateutil.parser import parse\nfrom progressbar import ProgressBar\n\ndata_str = open('earnings_dates.yaml', 'r').read()\n# Need to remove invalid lines\nfiltered = filter(lambda x: '{' not in x, data_str.split('\\n'))\nearnings_data = yaml.load('\\n'.join(filtered))\n\n# Convert our earnings data into a list of (ticker, date) pairs\n# to make it easy to work with.\n# This is horribly inefficient, but should get us what we need\nticker_dates = []\nfor ticker, date_list in earnings_data.items():\n    for iso_str in date_list:\n        ticker_dates.append((ticker, parse(iso_str)))\n\ndef does_trend_down(ticker, event, horizon):\n    # Figure out if the `event` has a downtrend for\n    # the `horizon` days preceding it\n    # As an interpretation note: it is assumed that\n    # the closing price of day `event` is the reference\n    # point, and we want `horizon` days before that.\n    # The price_data.hdf was created in the second appendix code block\n    try:\n        ticker_data = pd.read_hdf('price_data.hdf', ticker)\n        data = ticker_data[event-TradeDay(horizon):event]\n        midpoints = data['Open']/2 + data['Close']/2\n\n        # Shift dates one forward into the future and subtract\n        # Effectively: do we trend down over all days?\n        elems = midpoints - midpoints.shift(1)\n        return len(elems)-1 == len(elems.dropna()[elems <= 0])\n    except KeyError:\n        # If the stock doesn't exist, it doesn't qualify as trending down\n        # Mostly this is here to make sure the entire analysis doesn't \n        # blow up if there were issues in data retrieval\n        return False\n\ndef study_trend(horizon, trend_function):\n    five_day_events = np.zeros((1, horizon*2 + 1))\n    invalid_events = []\n    for ticker, event in ProgressBar()(ticker_dates):\n        if trend_function(ticker, event, horizon):\n            ticker_data = pd.read_hdf('price_data.hdf', ticker)\n            event_data = ticker_data[event-TradeDay(horizon):event+TradeDay(horizon)]['Close']\n\n            try:\n                five_day_events = np.vstack([five_day_events, event_data])\n            except ValueError:\n                # Sometimes we don't get exactly the right number of values due to calendar\n                # issues. I've fixed most everything I can, and the few issues that are left\n                # I assume don't systemically bias the results (i.e. data could be missing\n                # because it doesn't exist, etc.). After running through, ~1% of events get\n                # discarded this way\n                invalid_events.append((ticker, event))\n            \n\n    # Remove our initial zero row\n    five_day_events = five_day_events[1:,:]\n    plot_study(five_day_events)\n    plt.gcf().suptitle('Action over {} days: {} events'\n                       .format(horizon,five_day_events.shape[0]))\n    plt.gcf().set_size_inches(18, 6)\n    \n# Start with a 5 day study\nstudy_trend(5, does_trend_down)\n"})}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"    100% (47578 of 47578) |###########################################################| Elapsed Time: 0:21:38 Time: 0:21:38\n"})})]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(2446).Z+"",width:"1050",height:"397"})}),"\n",(0,r.jsxs)(n.p,{children:["When a stock has been trending down for 5 days, once the earnings are announced it really doesn't move on average. However, the variability is ",(0,r.jsx)(n.em,{children:"incredible"}),". This implies two important things:"]}),"\n",(0,r.jsxs)(n.ol,{children:["\n",(0,r.jsx)(n.li,{children:"The market is just as often wrong about an earnings announcement before it happens as it is correct"}),"\n",(0,r.jsxs)(n.li,{children:["The incredible width of the min/max bars and standard deviation area tell us that the market reacts ",(0,r.jsx)(n.em,{children:"violently"})," after the earnings are released."]}),"\n"]}),"\n",(0,r.jsx)(n.p,{children:"Let's repeat the same study, but over a time horizon of 8 days and 3 days. Presumably if a stock has been going down for 8 days at a time before the earnings, the market should be more accurate."}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"# 8 day study next\nstudy_trend(8, does_trend_down)\n"})}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"    100% (47578 of 47578) |###########################################################| Elapsed Time: 0:20:29 Time: 0:20:29\n"})})]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(3243).Z+"",width:"1047",height:"397"})}),"\n",(0,r.jsx)(n.p,{children:"However, looking only at stocks that trended down for 8 days prior to a release, the same pattern emerges: on average, the stock doesn't move, but the market reaction is often incredibly violent."}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"# 3 day study after that\nstudy_trend(3, does_trend_down)\n"})}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"    100% (47578 of 47578) |###########################################################| Elapsed Time: 0:26:26 Time: 0:26:26\n"})})]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(6810).Z+"",width:"1040",height:"397"})}),"\n",(0,r.jsx)(n.p,{children:"Finally, when we look at a 3-day horizon, we start getting some incredible outliers. Stocks have a potential to move over ~300% up, and the standard deviation width is again, incredible. The results for a 3-day horizon follow the same pattern we've seen in the 5- and 8-day horizons."}),"\n",(0,r.jsx)(n.h2,{id:"event-type-2-trending-up-for-n-days",children:"Event Type 2: Trending up for N days"}),"\n",(0,r.jsx)(n.p,{children:"We're now going to repeat the analysis, but do it for uptrends instead. That is, instead of looking at stocks that have been trending down over the past number of days, we focus only on stocks that have been trending up."}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"def does_trend_up(ticker, event, horizon):\n    # Figure out if the `event` has an uptrend for\n    # the `horizon` days preceding it\n    # As an interpretation note: it is assumed that\n    # the closing price of day `event` is the reference\n    # point, and we want `horizon` days before that.\n    # The price_data.hdf was created in the second appendix code block\n    try:\n        ticker_data = pd.read_hdf('price_data.hdf', ticker)\n        data = ticker_data[event-TradeDay(horizon):event]\n        midpoints = data['Open']/2 + data['Close']/2\n\n        # Shift dates one forward into the future and subtract\n        # Effectively: do we trend down over all days?\n        elems = midpoints - midpoints.shift(1)\n        return len(elems)-1 == len(elems.dropna()[elems >= 0])\n    except KeyError:\n        # If the stock doesn't exist, it doesn't qualify as trending down\n        # Mostly this is here to make sure the entire analysis doesn't \n        # blow up if there were issues in data retrieval\n        return False\n\nstudy_trend(5, does_trend_up)\n"})}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"    100% (47578 of 47578) |###########################################################| Elapsed Time: 0:22:51 Time: 0:22:51\n"})})]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(7600).Z+"",width:"1040",height:"397"})}),"\n",(0,r.jsx)(n.p,{children:"The patterns here are very similar. With the exception of noting that stocks can go to nearly 400% after an earnings announcement (most likely this included a takeover announcement, etc.), we still see large min/max bars and wide standard deviation of returns."}),"\n",(0,r.jsx)(n.p,{children:"We'll repeat the pattern for stocks going up for both 8 and 3 days straight, but at this point, the results should be very predictable:"}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"study_trend(8, does_trend_up)\n"})}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"    100% (47578 of 47578) |###########################################################| Elapsed Time: 0:20:51 Time: 0:20:51\n"})})]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(6955).Z+"",width:"1047",height:"397"})}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"study_trend(3, does_trend_up)\n"})}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"    100% (47578 of 47578) |###########################################################| Elapsed Time: 0:26:56 Time: 0:26:56\n"})})]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"png",src:t(5968).Z+"",width:"1040",height:"397"})}),"\n",(0,r.jsx)(n.h2,{id:"conclusion-and-summary",children:"Conclusion and Summary"}),"\n",(0,r.jsxs)(n.p,{children:["I guess the most important thing to summarize with is this: ",(0,r.jsx)(n.strong,{children:"looking at the entire market, stock performance prior to an earnings release has no bearing on the stock's performance."})," Honestly: given the huge variability of returns after an earnings release, even when the stock has been trending for a long time, you're best off divesting before an earnings release and letting the market sort itself out."]}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.em,{children:"However"}),", there is a big caveat. These results are taken when we look at the entire market. So while we can say that the market as a whole knows nothing and just reacts violently, I want to take a closer look into this data. Does the market typically perform poorly on large-cap/high liquidity stocks? Do smaller companies have investors that know them better and can thus predict performance better? Are specific market sectors better at prediction? Presumably technology stocks are more volatile than the industrials."]}),"\n",(0,r.jsx)(n.p,{children:"So there are some more interesting questions I still want to ask with this data. Knowing that the hard work of data processing is largely already done, it should be fairly simple to continue this analysis and get much more refined with it. Until next time."}),"\n",(0,r.jsx)(n.h1,{id:"appendix",children:"Appendix"}),"\n",(0,r.jsx)(n.p,{children:"Export event data for Russell 3000 companies:"}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"import pandas as pd\nfrom html.parser import HTMLParser\nfrom datetime import datetime, timedelta\nimport requests\nimport re\nfrom dateutil import parser\nimport progressbar\nfrom concurrent import futures\nimport yaml\n\nclass EarningsParser(HTMLParser):\n    store_dates = False\n    earnings_offset = None\n    dates = []\n    \n    def __init__(self, *args, **kwargs):\n        super().__init__(*args, **kwargs)\n        self.dates = []\n    \n    def handle_starttag(self, tag, attrs):\n        if tag == 'table':\n            self.store_dates = True\n            \n    def handle_data(self, data):\n        if self.store_dates:\n            match = re.match(r'\\d+/\\d+/\\d+', data)\n            if match:\n                self.dates.append(match.group(0))\n        \n        # If a company reports before the bell, record the earnings date\n        # being at midnight the day before. Ex: WMT reports 5/19/2016,\n        # but we want the reference point to be the closing price on 5/18/2016\n        if 'After Close' in data:\n            self.earnings_offset = timedelta(days=0)\n        elif 'Before Open' in data:\n            self.earnings_offset = timedelta(days=-1)\n                \n    def handle_endtag(self, tag):\n        if tag == 'table':\n            self.store_dates = False\n            \ndef earnings_releases(ticker):\n    #print(\"Looking up ticker {}\".format(ticker))\n    user_agent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:46.0) '\\\n        'Gecko/20100101 Firefox/46.0'\n    headers = {'user-agent': user_agent}\n    base_url = 'http://www.streetinsider.com/ec_earnings.php?q={}'\\\n        .format(ticker)\n    e = EarningsParser()\n    s = requests.Session()\n    a = requests.adapters.HTTPAdapter(max_retries=0)\n    s.mount('http://', a)\n    e.feed(str(s.get(base_url, headers=headers).content))\n    \n    if e.earnings_offset is not None:\n        dates = map(lambda x: parser.parse(x) + e.earnings_offset, e.dates)\n        past = filter(lambda x: x < datetime.now(), dates)\n        return list(map(lambda d: d.isoformat(), past))\n\n# Use a Russell-3000 ETF tracker (ticker IWV) to get a list of holdings\nr3000 = pd.read_csv('https://www.ishares.com/us/products/239714/'\n                    'ishares-russell-3000-etf/1449138789749.ajax?'\n                    'fileType=csv&fileName=IWV_holdings&dataType=fund',\n                    header=10)\nr3000_equities = r3000[(r3000['Exchange'] == 'NASDAQ') |\n                       (r3000['Exchange'] == 'New York Stock Exchange Inc.')]\n\ndates_file = open('earnings_dates.yaml', 'w')\n\nwith futures.ThreadPoolExecutor(max_workers=8) as pool:\n    fs = {pool.submit(earnings_releases, r3000_equities.ix[t]['Ticker']): t\n          for t in r3000_equities.index}\n    pbar = progressbar.ProgressBar(term_width=80,\n                                   max_value=r3000_equities.index.max())\n    \n    for future in futures.as_completed(fs):\n        i = fs[future]\n        pbar.update(i)\n        dates_file.write(yaml.dump({r3000_equities.ix[i]['Ticker']:\n            future.result()}))\n"})})]}),"\n",(0,r.jsx)(n.p,{children:"Downloading stock price data needed for the event studies:"}),"\n",(0,r.jsxs)(a,{children:[(0,r.jsx)("summary",{children:"Code"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"from secrets import QUANDL_KEY\nimport pandas as pd\nimport yaml\nfrom dateutil.parser import parse\nfrom datetime import timedelta\nimport quandl\nfrom progressbar import ProgressBar\n\ndef fetch_ticker(ticker, start, end):\n    # Quandl is currently giving me issues with returning\n    # the entire dataset and not slicing server-side.\n    # So instead, we'll do it client-side!\n    q_format = '%Y-%m-%d'\n    ticker_data = quandl.get('YAHOO/' + ticker,\n                             start_date=start.strftime(q_format),\n                             end_date=end.strftime(q_format),\n                             authtoken=QUANDL_KEY)\n    return ticker_data\n    \ndata_str = open('earnings_dates.yaml', 'r').read()\n# Need to remove invalid lines\nfiltered = filter(lambda x: '{' not in x, data_str.split('\\n'))\nearnings_data = yaml.load('\\n'.join(filtered))\n\n# Get the first 1500 keys - split up into two statements\n# because of Quandl rate limits\ntickers = list(earnings_data.keys())\n\nprice_dict = {}\ninvalid_tickers = []\nfor ticker in ProgressBar()(tickers[0:1500]):\n    try:\n        # Replace '.' with '-' in name for some tickers\n        fixed = ticker.replace('.', '-')\n        event_strs = earnings_data[ticker]\n        events = [parse(event) for event in event_strs]\n        td = timedelta(days=20)\n        price_dict[ticker] = fetch_ticker(fixed,\n            min(events)-td, max(events)+td)\n    except quandl.NotFoundError:\n        invalid_tickers.append(ticker)\n        \n# Execute this after 10 minutes have passed\nfor ticker in ProgressBar()(tickers[1500:]):\n    try:\n        # Replace '.' with '-' in name for some tickers\n        fixed = ticker.replace('.', '-')\n        event_strs = earnings_data[ticker]\n        events = [parse(event) for event in event_strs]\n        td = timedelta(days=20)\n        price_dict[ticker] = fetch_ticker(fixed,\n            min(events)-td, max(events)+td)\n    except quandl.NotFoundError:\n        invalid_tickers.append(ticker)\n \nprices_store = pd.HDFStore('price_data.hdf')\nfor ticker, prices in price_dict.items():\n    prices_store[ticker] = prices\n"})})]})]})}function h(e={}){let{wrapper:n}={...(0,s.a)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},7134:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_11_0-1c14b9b64e0cc03bce9e40f936d85202.png"},6403:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_14_0-8fad23eda4377ce379465c56be3eb022.png"},2446:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_16_1-144f4c4021e22c02fe015acc38d26343.png"},3243:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_18_1-0c204d1f3b296db4c925816140a946f2.png"},6810:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_20_1-76d1356ea34f0db5122ddbeb90dc117c.png"},7600:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_23_1-86585ab19c818b386afb7ec00dbec595.png"},6955:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_25_1-0db87f90eaf0febd08b4775910528a75.png"},5968:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_26_1-686b3995a84cbcac983b369843d1e222.png"},8409:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_3_0-6ba22789c3bcc8bd99c64f3fbfa11b30.png"},4400:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_5_0-34febf65365a147cd218c9266b77e4fb.png"},8475:function(e,n,t){t.d(n,{Z:function(){return a}});let a=t.p+"assets/images/_notebook_7_0-a9df30d31e6b96a01619455d5040eb8b.png"},65:function(e,n,t){t.d(n,{Z:function(){return o},a:function(){return i}});var a=t(7294);let r={},s=a.createContext(r);function i(e){let n=a.useContext(s);return a.useMemo(function(){return"function"==typeof e?e(n):{...n,...e}},[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),a.createElement(s.Provider,{value:n},e.children)}},173:function(e){e.exports=JSON.parse('{"permalink":"/2016/06/event-studies-and-earnings-releases","source":"@site/blog/2016-06-08-event-studies-and-earnings-releases/index.mdx","title":"Event studies and earnings releases","description":"Or, being suspicious of market insiders.","date":"2016-06-08T12:00:00.000Z","tags":[],"readingTime":16.01,"hasTruncateMarker":true,"authors":[{"name":"Bradlee Speice","socials":{"github":"https://github.com/bspeice"},"key":"bspeice","page":null}],"frontMatter":{"slug":"2016/06/event-studies-and-earnings-releases","title":"Event studies and earnings releases","date":"2016-06-08T12:00:00.000Z","authors":["bspeice"],"tags":[]},"unlisted":false,"lastUpdatedAt":1730863976000,"prevItem":{"title":"A Rustic re-podcasting server","permalink":"/2016/10/rustic-repodcasting"},"nextItem":{"title":"The unfair casino","permalink":"/2016/05/the-unfair-casino"}}')}}]);