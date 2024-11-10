```julia
using Gadfly
```

# Athena/Phoenix Simulation

## Underlying simulation

In order to price the autocallable bonds, we need to simulate the underlying assets. Let's go ahead and set up the simulation first, as this lays the foundation for what we're trying to do. We're going to use [JNJ](http://finance.yahoo.com/q?s=jnj) as the basis for our simulation. This implies the following parameters:

- $S_0$ = \$102.2 (as of time of writing)
- $q$ = 2.84%
- $r$ = [.49, .9, 1.21, 1.45, 1.69] (term structure as of time of writing, linear interpolation)
- $\mu$ = $r - q$ (note that this implies a negative drift because of current low rates)
- $\sigma$ = $\sigma_{imp}$ = 15.62% (from VIX implied volatility)

We additionally define some parameters for simulation:

- `T`: The number of years to simulate
- `m`: The number of paths to simulate
- `n`: The number of steps to simulate in a year


```julia
S0 = 102.2
nominal = 100
q = 2.84 / 100
σ = 15.37 / 100
term = [0, .49, .9, 1.21, 1.45, 1.69] / 100 + 1

###
# Potential: Based on PEP
# S0 = 100.6
# σ = 14.86
# q = 2.7
###

# Simulation parameters
T = 5 # Using years as the unit of time
n = 250 # simulations per year
m = 100000 # paths
num_simulations = 5; # simulation rounds per price
```




    5



### Defining the simulation
To make things simpler, we simulate a single year at a time. This allows us to easily add in a dividend policy without too much difficulty, and update the simulation every year to match the term structure. The underlying uses GBM for simulation between years.


```julia
simulate_gbm = function(S0, μ, σ, T, n)
    # Set the initial state
    m = length(S0)
    t = T / n
    motion = zeros(m, n)
    motion[:,1] = S0
    
    # Build out all states
    for i=1:(n-1)
        motion[:,i+1] = motion[:,i] .* exp((μ - σ^2/2)*t) .* exp(sqrt(t) * σ .* randn(m))
    end
    
    return motion
end

function display_motion(motion, T)
    # Given a matrix of paths, display the motion
    n = length(motion[1,:])
    m = length(motion[:,1])
    x = repmat(1:n, m)
    
    # Calculate the ticks we're going to use. We'd like to
    # have an xtick every month, so calculate where those
    # ticks will actually be at.
    if (T > 3)
        num_ticks = T
        xlabel = "Years"
    else
        num_ticks = T * 12
        xlabel = "Months"
    end
    tick_width = n / num_ticks
    x_ticks = []
    for i=1:round(num_ticks)
        x_ticks = vcat(x_ticks, i*tick_width)
    end
    
    # Use one color for each path. I'm not sure if there's
    # a better way to do this without going through DataFrames
    colors = []
    for i = 1:m
        colors = vcat(colors, ones(n)*i)
    end
    
    plot(x=x, y=motion', color=colors, Geom.line,
    Guide.xticks(ticks=x_ticks, label=false),
    Guide.xlabel(xlabel),
    Guide.ylabel("Value"))
end;
```

### Example simulation

Let's go ahead and run a sample simulation to see what the functions got us!


```julia
initial = ones(5) * S0
# Using μ=0, T=.25 for now, we'll use the proper values later
motion = simulate_gbm(initial, 0, σ, .25, 200) 

display_motion(motion, .25)
```




<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:gadfly="http://www.gadflyjl.org/ns"
     version="1.2"
     width="141.42mm" height="100mm" viewBox="0 0 141.42 100"
     stroke="none"
     fill="#000000"
     stroke-width="0.3"
     font-size="3.88"

     id="fig-3a6dd25ad25c4037a166889ee51bb151">
<g class="plotroot xscalable yscalable" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-1">
  <g font-size="3.88" font-family="'PT Sans','Helvetica Neue','Helvetica',sans-serif" fill="#564A55" stroke="#000000" stroke-opacity="0.000" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-2">
    <text x="73.61" y="88.39" text-anchor="middle" dy="0.6em">Months</text>
  </g>
  <g class="guide colorkey" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-3">
    <g font-size="2.82" font-family="'PT Sans','Helvetica Neue','Helvetica',sans-serif" fill="#4C404B" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-4">
      <text x="131.9" y="66.46" dy="0.35em">1</text>
      <text x="131.9" y="39.15" dy="0.35em">5</text>
      <text x="131.9" y="59.63" dy="0.35em">2</text>
      <text x="131.9" y="52.81" dy="0.35em">3</text>
      <text x="131.9" y="45.98" dy="0.35em">4</text>
    </g>
    <g shape-rendering="crispEdges" stroke="#000000" stroke-opacity="0.000" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-5">
      <rect x="129.58" y="65.78" width="1.31" height="0.68" fill="#004D84"/>
      <rect x="129.58" y="65.1" width="1.31" height="0.68" fill="#005B8D"/>
      <rect x="129.58" y="64.41" width="1.31" height="0.68" fill="#006995"/>
      <rect x="129.58" y="63.73" width="1.31" height="0.68" fill="#00769D"/>
      <rect x="129.58" y="63.05" width="1.31" height="0.68" fill="#0083A3"/>
      <rect x="129.58" y="62.36" width="1.31" height="0.68" fill="#278FA9"/>
      <rect x="129.58" y="61.68" width="1.31" height="0.68" fill="#409BAF"/>
      <rect x="129.58" y="61" width="1.31" height="0.68" fill="#55A7B5"/>
      <rect x="129.58" y="60.32" width="1.31" height="0.68" fill="#69B2BA"/>
      <rect x="129.58" y="59.63" width="1.31" height="0.68" fill="#7BBCC0"/>
      <rect x="129.58" y="58.95" width="1.31" height="0.68" fill="#8DC6C5"/>
      <rect x="129.58" y="58.27" width="1.31" height="0.68" fill="#9ED0CB"/>
      <rect x="129.58" y="57.59" width="1.31" height="0.68" fill="#A5CFC7"/>
      <rect x="129.58" y="56.9" width="1.31" height="0.68" fill="#ABCEC4"/>
      <rect x="129.58" y="56.22" width="1.31" height="0.68" fill="#B1CCC2"/>
      <rect x="129.58" y="55.54" width="1.31" height="0.68" fill="#B5CCC1"/>
      <rect x="129.58" y="54.85" width="1.31" height="0.68" fill="#B7CBBF"/>
      <rect x="129.58" y="54.17" width="1.31" height="0.68" fill="#B9CBBD"/>
      <rect x="129.58" y="53.49" width="1.31" height="0.68" fill="#BBCBBB"/>
      <rect x="129.58" y="52.81" width="1.31" height="0.68" fill="#BDCABA"/>
      <rect x="129.58" y="52.12" width="1.31" height="0.68" fill="#BFCAB8"/>
      <rect x="129.58" y="51.44" width="1.31" height="0.68" fill="#C2C9B7"/>
      <rect x="129.58" y="50.76" width="1.31" height="0.68" fill="#C4C9B6"/>
      <rect x="129.58" y="50.07" width="1.31" height="0.68" fill="#C6C8B5"/>
      <rect x="129.58" y="49.39" width="1.31" height="0.68" fill="#C9C7B4"/>
      <rect x="129.58" y="48.71" width="1.31" height="0.68" fill="#CCC7B2"/>
      <rect x="129.58" y="48.03" width="1.31" height="0.68" fill="#CFC6AE"/>
      <rect x="129.58" y="47.34" width="1.31" height="0.68" fill="#D4C5AA"/>
      <rect x="129.58" y="46.66" width="1.31" height="0.68" fill="#D8C3A6"/>
      <rect x="129.58" y="45.98" width="1.31" height="0.68" fill="#D3B79A"/>
      <rect x="129.58" y="45.3" width="1.31" height="0.68" fill="#CDAB8E"/>
      <rect x="129.58" y="44.61" width="1.31" height="0.68" fill="#C89E82"/>
      <rect x="129.58" y="43.93" width="1.31" height="0.68" fill="#C19177"/>
      <rect x="129.58" y="43.25" width="1.31" height="0.68" fill="#BA836C"/>
      <rect x="129.58" y="42.56" width="1.31" height="0.68" fill="#B27563"/>
      <rect x="129.58" y="41.88" width="1.31" height="0.68" fill="#AA665A"/>
      <rect x="129.58" y="41.2" width="1.31" height="0.68" fill="#A05752"/>
      <rect x="129.58" y="40.52" width="1.31" height="0.68" fill="#96484A"/>
      <rect x="129.58" y="39.83" width="1.31" height="0.68" fill="#8B3844"/>
      <rect x="129.58" y="39.15" width="1.31" height="0.68" fill="#7E273E"/>
      <g stroke="#FFFFFF" stroke-width="0.2" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-6">
        <path fill="none" d="M129.58,66.46 L 130.9 66.46"/>
        <path fill="none" d="M129.58,39.15 L 130.9 39.15"/>
        <path fill="none" d="M129.58,59.63 L 130.9 59.63"/>
        <path fill="none" d="M129.58,52.81 L 130.9 52.81"/>
        <path fill="none" d="M129.58,45.98 L 130.9 45.98"/>
      </g>
    </g>
    <g fill="#362A35" font-size="3.88" font-family="'PT Sans','Helvetica Neue','Helvetica',sans-serif" stroke="#000000" stroke-opacity="0.000" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-7">
      <text x="129.58" y="35.15">Color</text>
    </g>
  </g>
  <g clip-path="url(#fig-3a6dd25ad25c4037a166889ee51bb151-element-9)" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-8">
    <g pointer-events="visible" opacity="1" fill="#000000" fill-opacity="0.000" stroke="#000000" stroke-opacity="0.000" class="guide background" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-10">
      <rect x="19.63" y="5" width="107.95" height="80.39"/>
    </g>
    <g class="guide ygridlines xfixed" stroke-dasharray="0.5,0.5" stroke-width="0.2" stroke="#D0D0E0" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-11">
      <path fill="none" d="M19.63,175.05 L 127.58 175.05" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,159.78 L 127.58 159.78" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,144.5 L 127.58 144.5" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,129.22 L 127.58 129.22" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,113.94 L 127.58 113.94" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,98.67 L 127.58 98.67" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,83.39 L 127.58 83.39" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,68.11 L 127.58 68.11" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,52.83 L 127.58 52.83" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,37.56 L 127.58 37.56" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,22.28 L 127.58 22.28" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,7 L 127.58 7" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-8.28 L 127.58 -8.28" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-23.56 L 127.58 -23.56" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-38.83 L 127.58 -38.83" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-54.11 L 127.58 -54.11" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-69.39 L 127.58 -69.39" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-84.67 L 127.58 -84.67" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,159.78 L 127.58 159.78" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,156.72 L 127.58 156.72" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,153.67 L 127.58 153.67" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,150.61 L 127.58 150.61" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,147.55 L 127.58 147.55" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,144.5 L 127.58 144.5" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,141.44 L 127.58 141.44" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,138.39 L 127.58 138.39" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,135.33 L 127.58 135.33" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,132.28 L 127.58 132.28" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,129.22 L 127.58 129.22" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,126.17 L 127.58 126.17" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,123.11 L 127.58 123.11" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,120.05 L 127.58 120.05" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,117 L 127.58 117" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,113.94 L 127.58 113.94" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,110.89 L 127.58 110.89" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,107.83 L 127.58 107.83" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,104.78 L 127.58 104.78" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,101.72 L 127.58 101.72" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,98.67 L 127.58 98.67" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,95.61 L 127.58 95.61" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,92.55 L 127.58 92.55" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,89.5 L 127.58 89.5" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,86.44 L 127.58 86.44" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,83.39 L 127.58 83.39" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,80.33 L 127.58 80.33" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,77.28 L 127.58 77.28" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,74.22 L 127.58 74.22" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,71.17 L 127.58 71.17" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,68.11 L 127.58 68.11" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,65.06 L 127.58 65.06" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,62 L 127.58 62" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,58.94 L 127.58 58.94" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,55.89 L 127.58 55.89" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,52.83 L 127.58 52.83" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,49.78 L 127.58 49.78" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,46.72 L 127.58 46.72" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,43.67 L 127.58 43.67" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,40.61 L 127.58 40.61" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,37.56 L 127.58 37.56" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,34.5 L 127.58 34.5" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,31.44 L 127.58 31.44" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,28.39 L 127.58 28.39" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,25.33 L 127.58 25.33" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,22.28 L 127.58 22.28" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,19.22 L 127.58 19.22" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,16.17 L 127.58 16.17" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,13.11 L 127.58 13.11" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,10.06 L 127.58 10.06" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,7 L 127.58 7" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,3.94 L 127.58 3.94" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,0.89 L 127.58 0.89" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-2.17 L 127.58 -2.17" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-5.22 L 127.58 -5.22" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-8.28 L 127.58 -8.28" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-11.33 L 127.58 -11.33" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-14.39 L 127.58 -14.39" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-17.44 L 127.58 -17.44" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-20.5 L 127.58 -20.5" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-23.56 L 127.58 -23.56" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-26.61 L 127.58 -26.61" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-29.67 L 127.58 -29.67" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-32.72 L 127.58 -32.72" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-35.78 L 127.58 -35.78" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-38.83 L 127.58 -38.83" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-41.89 L 127.58 -41.89" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-44.94 L 127.58 -44.94" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-48 L 127.58 -48" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-51.06 L 127.58 -51.06" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-54.11 L 127.58 -54.11" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-57.17 L 127.58 -57.17" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-60.22 L 127.58 -60.22" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-63.28 L 127.58 -63.28" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-66.33 L 127.58 -66.33" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-69.39 L 127.58 -69.39" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,220.89 L 127.58 220.89" visibility="hidden" gadfly:scale="0.5"/>
      <path fill="none" d="M19.63,68.11 L 127.58 68.11" visibility="hidden" gadfly:scale="0.5"/>
      <path fill="none" d="M19.63,-84.67 L 127.58 -84.67" visibility="hidden" gadfly:scale="0.5"/>
      <path fill="none" d="M19.63,159.78 L 127.58 159.78" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,153.67 L 127.58 153.67" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,147.55 L 127.58 147.55" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,141.44 L 127.58 141.44" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,135.33 L 127.58 135.33" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,129.22 L 127.58 129.22" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,123.11 L 127.58 123.11" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,117 L 127.58 117" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,110.89 L 127.58 110.89" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,104.78 L 127.58 104.78" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,98.67 L 127.58 98.67" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,92.55 L 127.58 92.55" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,86.44 L 127.58 86.44" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,80.33 L 127.58 80.33" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,74.22 L 127.58 74.22" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,68.11 L 127.58 68.11" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,62 L 127.58 62" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,55.89 L 127.58 55.89" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,49.78 L 127.58 49.78" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,43.67 L 127.58 43.67" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,37.56 L 127.58 37.56" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,31.44 L 127.58 31.44" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,25.33 L 127.58 25.33" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,19.22 L 127.58 19.22" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,13.11 L 127.58 13.11" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,7 L 127.58 7" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,0.89 L 127.58 0.89" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-5.22 L 127.58 -5.22" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-11.33 L 127.58 -11.33" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-17.44 L 127.58 -17.44" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-23.56 L 127.58 -23.56" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-29.67 L 127.58 -29.67" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-35.78 L 127.58 -35.78" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-41.89 L 127.58 -41.89" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-48 L 127.58 -48" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-54.11 L 127.58 -54.11" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-60.22 L 127.58 -60.22" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-66.33 L 127.58 -66.33" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-72.44 L 127.58 -72.44" visibility="hidden" gadfly:scale="5.0"/>
    </g>
    <g class="guide xgridlines yfixed" stroke-dasharray="0.5,0.5" stroke-width="0.2" stroke="#D0D0E0" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-12">
      <path fill="none" d="M55.93,5 L 55.93 85.39" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M90.76,5 L 90.76 85.39" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M125.58,5 L 125.58 85.39" visibility="visible" gadfly:scale="1.0"/>
    </g>
    <g class="plotpanel" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-13">
      <g stroke-width="0.3" fill="#000000" fill-opacity="0.000" stroke-dasharray="none" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-14">
        <path fill="none" d="M21.63,61.39 L 22.15 63.01 22.68 64.88 23.2 65.75 23.72 65.53 24.24 66.19 24.77 65.44 25.29 64.6 25.81 62.6 26.33 64.24 26.86 63.14 27.38 62.41 27.9 61.76 28.42 60.15 28.94 59.51 29.47 59.43 29.99 57.05 30.51 57.31 31.03 58.76 31.56 60.04 32.08 59.29 32.6 56.95 33.12 58.64 33.65 58.8 34.17 60.04 34.69 61.19 35.21 60.49 35.74 58.06 36.26 59.33 36.78 59.15 37.3 60.03 37.83 57.9 38.35 60.9 38.87 60.47 39.39 61.8 39.91 62.99 40.44 62.59 40.96 62.85 41.48 61.37 42 60.8 42.53 60.36 43.05 61.74 43.57 59.57 44.09 63.47 44.62 65.21 45.14 64.53 45.66 61.4 46.18 60.13 46.71 58.91 47.23 57.72 47.75 55.68 48.27 54.24 48.8 52.75 49.32 51.15 49.84 51.7 50.36 51.13 50.88 50.26 51.41 50.58 51.93 49.94 52.45 49.43 52.97 47.26 53.5 47.63 54.02 43.28 54.54 41.73 55.06 38.71 55.59 36.85 56.11 38.83 56.63 40.76 57.15 40.38 57.68 38.32 58.2 40.53 58.72 41.71 59.24 45.53 59.77 44.75 60.29 42.69 60.81 43.54 61.33 47.48 61.85 46.26 62.38 49.17 62.9 51.72 63.42 51.08 63.94 48.32 64.47 49.22 64.99 46.99 65.51 45.37 66.03 44.84 66.56 49.23 67.08 49.47 67.6 48.5 68.12 48.55 68.65 50.2 69.17 52.04 69.69 48.28 70.21 49.14 70.74 47.87 71.26 44.77 71.78 45.94 72.3 46.46 72.82 48.27 73.35 45.57 73.87 44.73 74.39 44.69 74.91 41.97 75.44 42.75 75.96 42.73 76.48 42.15 77 42.15 77.53 42.06 78.05 42.3 78.57 42.05 79.09 38.58 79.62 37.43 80.14 37.45 80.66 37.58 81.18 37.02 81.71 37.77 82.23 34.18 82.75 34.92 83.27 34.3 83.79 31.3 84.32 30.74 84.84 31.04 85.36 33.45 85.88 37.48 86.41 40.9 86.93 38.85 87.45 40.71 87.97 39.53 88.5 37.84 89.02 35.57 89.54 34.28 90.06 32.61 90.59 31.25 91.11 31.69 91.63 30.35 92.15 28.63 92.67 32.02 93.2 31.58 93.72 31.03 94.24 30.32 94.76 33.63 95.29 37.51 95.81 38.21 96.33 38.63 96.85 39 97.38 38.02 97.9 39.92 98.42 41.11 98.94 41.89 99.47 40.85 99.99 39.33 100.51 36.48 101.03 37.12 101.56 33.6 102.08 33.78 102.6 30.27 103.12 29.93 103.64 26.12 104.17 26.05 104.69 24.24 105.21 25.87 105.73 27.08 106.26 25.68 106.78 28.93 107.3 28.27 107.82 29.74 108.35 29.07 108.87 27.61 109.39 28.83 109.91 27.94 110.44 24.59 110.96 21.98 111.48 23.57 112 22.27 112.53 23.76 113.05 24.49 113.57 24.01 114.09 27.19 114.61 29.62 115.14 30.47 115.66 31.48 116.18 34.04 116.7 29.61 117.23 29.29 117.75 31.04 118.27 29.64 118.79 32.69 119.32 33.45 119.84 35.26 120.36 36.97 120.88 36.6 121.41 37.29 121.93 39.06 122.45 38.48 122.97 39.26 123.5 39.98 124.02 38.69 124.54 38.15 125.06 37.06 125.58 39.61" class="geometry color_" stroke="#004D84"/>
        <path fill="none" d="M21.63,61.39 L 22.15 61.55 22.68 59.53 23.2 62.63 23.72 61.1 24.24 60.87 24.77 63.38 25.29 63.77 25.81 65.57 26.33 63.22 26.86 63.73 27.38 63.29 27.9 60.76 28.42 60.09 28.94 60 29.47 58.56 29.99 59.7 30.51 59.73 31.03 57.99 31.56 58.25 32.08 60.02 32.6 63.02 33.12 63.52 33.65 64.28 34.17 63.56 34.69 65.89 35.21 65.14 35.74 64.68 36.26 61.26 36.78 60.1 37.3 58.77 37.83 58.54 38.35 59.44 38.87 61.08 39.39 59.79 39.91 59.06 40.44 59.77 40.96 58.28 41.48 60.23 42 59.88 42.53 55.28 43.05 58.62 43.57 58.51 44.09 58.98 44.62 56.77 45.14 54.9 45.66 55.78 46.18 55.1 46.71 56.55 47.23 58.27 47.75 56.82 48.27 56.24 48.8 54.06 49.32 56.41 49.84 55.68 50.36 58.5 50.88 57.87 51.41 58.81 51.93 59.87 52.45 61.56 52.97 65.32 53.5 65.49 54.02 65.91 54.54 67.73 55.06 66.87 55.59 67.38 56.11 64.09 56.63 63.02 57.15 63.89 57.68 62.49 58.2 61.84 58.72 63.22 59.24 62.02 59.77 62.72 60.29 62.27 60.81 62.55 61.33 58.97 61.85 57.07 62.38 60.9 62.9 61.93 63.42 61.82 63.94 61.85 64.47 61.73 64.99 62.68 65.51 64.04 66.03 61.26 66.56 62.96 67.08 64.38 67.6 65.88 68.12 66.68 68.65 68.22 69.17 67.78 69.69 69.38 70.21 70.75 70.74 72.39 71.26 70.94 71.78 72.08 72.3 72.27 72.82 73.58 73.35 73.74 73.87 72.35 74.39 72.22 74.91 74.12 75.44 75.3 75.96 74.87 76.48 75.32 77 74.8 77.53 74.11 78.05 74.5 78.57 69.69 79.09 72.14 79.62 69.69 80.14 69.75 80.66 69.51 81.18 71.33 81.71 73.9 82.23 72.82 82.75 70.59 83.27 71.59 83.79 71.58 84.32 71.71 84.84 69.86 85.36 70.05 85.88 69.15 86.41 72.2 86.93 69.53 87.45 70.69 87.97 70.15 88.5 69.51 89.02 67.76 89.54 67.41 90.06 67.64 90.59 67.5 91.11 68.27 91.63 68.42 92.15 68.23 92.67 68.39 93.2 68.47 93.72 69.07 94.24 71.95 94.76 74.34 95.29 75.63 95.81 74.08 96.33 71.92 96.85 71.36 97.38 71.17 97.9 68.55 98.42 70.43 98.94 71.01 99.47 70.5 99.99 69.72 100.51 69.93 101.03 66.34 101.56 64.29 102.08 67.1 102.6 68.99 103.12 70.73 103.64 67.44 104.17 68.72 104.69 71.08 105.21 70.44 105.73 71.41 106.26 69.46 106.78 67.03 107.3 66.86 107.82 68.11 108.35 67.18 108.87 67.67 109.39 66.77 109.91 67.01 110.44 65.42 110.96 66.32 111.48 68.51 112 68.31 112.53 66.43 113.05 67.65 113.57 68.46 114.09 67.9 114.61 69.27 115.14 65.25 115.66 63.92 116.18 63.66 116.7 62.69 117.23 62.57 117.75 63.19 118.27 64.28 118.79 61.75 119.32 62.08 119.84 62.38 120.36 62.89 120.88 61.83 121.41 60.06 121.93 58.9 122.45 57.83 122.97 56.53 123.5 58.83 124.02 57.9 124.54 59.82 125.06 59.66 125.58 60.89" class="geometry color_" stroke="#7E273E"/>
        <path fill="none" d="M21.63,61.39 L 22.15 62.01 22.68 62.12 23.2 64.62 23.72 64.89 24.24 60.83 24.77 58.38 25.29 57.87 25.81 59.4 26.33 59.29 26.86 58.42 27.38 58.88 27.9 61.48 28.42 61.57 28.94 63.47 29.47 63.35 29.99 64.6 30.51 66.75 31.03 67.31 31.56 66.27 32.08 66.88 32.6 66.7 33.12 68.45 33.65 68.23 34.17 69.78 34.69 70.71 35.21 68.96 35.74 71.3 36.26 71.51 36.78 72.6 37.3 71.53 37.83 68.39 38.35 67.9 38.87 68.04 39.39 66.79 39.91 65.4 40.44 66.69 40.96 66.18 41.48 65.4 42 63.44 42.53 61.3 43.05 63.19 43.57 61.69 44.09 58.24 44.62 57.65 45.14 56.99 45.66 58.92 46.18 58.42 46.71 57.78 47.23 56.04 47.75 55.47 48.27 53.63 48.8 50.38 49.32 50.16 49.84 47.49 50.36 46.04 50.88 45.37 51.41 45.88 51.93 46.2 52.45 48.8 52.97 46.81 53.5 47.41 54.02 44.95 54.54 42.2 55.06 40.28 55.59 40.95 56.11 41.25 56.63 42.26 57.15 45.49 57.68 49.57 58.2 51.75 58.72 51.28 59.24 50.92 59.77 50.58 60.29 49.25 60.81 48.75 61.33 50.04 61.85 51.83 62.38 56.12 62.9 58.24 63.42 53.76 63.94 48.49 64.47 49.53 64.99 48.91 65.51 47.5 66.03 44.98 66.56 45.34 67.08 45.47 67.6 47.09 68.12 45.28 68.65 46.64 69.17 46.73 69.69 47.31 70.21 41.61 70.74 40.78 71.26 39.14 71.78 38.12 72.3 38.34 72.82 38.18 73.35 38.73 73.87 38.42 74.39 38.55 74.91 38.09 75.44 37.59 75.96 37.78 76.48 35.41 77 31.8 77.53 33.17 78.05 33.1 78.57 31.68 79.09 33.07 79.62 34.53 80.14 34.08 80.66 33.6 81.18 32.97 81.71 32.22 82.23 32.64 82.75 35.43 83.27 36.8 83.79 37.78 84.32 39.79 84.84 40.84 85.36 40.79 85.88 37.93 86.41 34.02 86.93 33.81 87.45 34.55 87.97 32.24 88.5 29.77 89.02 29.49 89.54 34.31 90.06 34.92 90.59 36.37 91.11 33.74 91.63 37.64 92.15 36.01 92.67 39.21 93.2 39.67 93.72 38.94 94.24 41.03 94.76 42.02 95.29 41.38 95.81 40.65 96.33 41.11 96.85 42.33 97.38 41.38 97.9 39.81 98.42 37.69 98.94 38.54 99.47 35.99 99.99 35.41 100.51 38.56 101.03 38.77 101.56 40.05 102.08 42.32 102.6 43.14 103.12 43.52 103.64 46.7 104.17 45.1 104.69 43.26 105.21 42.06 105.73 45.01 106.26 44.86 106.78 43.66 107.3 43.57 107.82 43.53 108.35 44.76 108.87 44.65 109.39 46.06 109.91 44.57 110.44 49.26 110.96 49.18 111.48 51.74 112 51.36 112.53 52.06 113.05 55.72 113.57 57.48 114.09 59.83 114.61 61.84 115.14 63.48 115.66 63.61 116.18 62.01 116.7 62.46 117.23 62.32 117.75 63.34 118.27 61.52 118.79 61.6 119.32 59.09 119.84 61.22 120.36 62.07 120.88 62.68 121.41 64.73 121.93 65.46 122.45 63.95 122.97 63.8 123.5 65.66 124.02 63.97 124.54 62.93 125.06 62.62 125.58 59.34" class="geometry color_" stroke="#88C4C4"/>
        <path fill="none" d="M21.63,61.39 L 22.15 61.13 22.68 60.81 23.2 62.02 23.72 62.26 24.24 60.5 24.77 57.82 25.29 56.74 25.81 56.51 26.33 58.2 26.86 60.28 27.38 61.78 27.9 58.53 28.42 57.05 28.94 57.46 29.47 56.25 29.99 55.53 30.51 56.65 31.03 57.59 31.56 54.25 32.08 55.32 32.6 56.21 33.12 59.52 33.65 59.2 34.17 60.8 34.69 62.11 35.21 62.65 35.74 63.18 36.26 65.53 36.78 62.71 37.3 61.28 37.83 62.17 38.35 64.09 38.87 65.57 39.39 68.22 39.91 69.83 40.44 71.7 40.96 72.83 41.48 72.38 42 73.06 42.53 75.36 43.05 74.31 43.57 72.7 44.09 72.32 44.62 72.66 45.14 71.6 45.66 70.6 46.18 71.62 46.71 70.85 47.23 71.92 47.75 72.63 48.27 70.05 48.8 70.08 49.32 66.73 49.84 67.47 50.36 66.88 50.88 69.37 51.41 68.11 51.93 68.23 52.45 68.51 52.97 68.65 53.5 68.56 54.02 70.73 54.54 69.14 55.06 69.57 55.59 69.92 56.11 72.37 56.63 73.95 57.15 73.32 57.68 73.92 58.2 73.39 58.72 73.43 59.24 73.68 59.77 74.47 60.29 72.03 60.81 72.45 61.33 73.14 61.85 73.15 62.38 71.74 62.9 69.85 63.42 70.7 63.94 71.26 64.47 72.88 64.99 74.1 65.51 70.79 66.03 70.7 66.56 70.99 67.08 70.58 67.6 69.57 68.12 68.88 68.65 70.25 69.17 68.44 69.69 66.43 70.21 66.82 70.74 67.93 71.26 66.66 71.78 68.22 72.3 67.71 72.82 70.26 73.35 69.76 73.87 70.48 74.39 68.83 74.91 69.78 75.44 69.89 75.96 73.59 76.48 67.68 77 68.15 77.53 64.77 78.05 62.61 78.57 63.48 79.09 64.13 79.62 63.34 80.14 64.97 80.66 66.9 81.18 67.84 81.71 65.25 82.23 65.96 82.75 68.01 83.27 67.94 83.79 67.69 84.32 67.66 84.84 65.74 85.36 66.5 85.88 66.92 86.41 66.41 86.93 68.51 87.45 71.01 87.97 71.21 88.5 72.5 89.02 73.18 89.54 70.08 90.06 72.06 90.59 74.8 91.11 74.42 91.63 75.56 92.15 73.31 92.67 74.09 93.2 75.35 93.72 74.34 94.24 77.32 94.76 74.76 95.29 72.97 95.81 71.55 96.33 72.98 96.85 75.64 97.38 75.6 97.9 76.73 98.42 74.28 98.94 73.56 99.47 73.22 99.99 74.74 100.51 74.37 101.03 73.72 101.56 75.73 102.08 76.29 102.6 75.49 103.12 74.57 103.64 76.28 104.17 75.11 104.69 74.66 105.21 77.83 105.73 80.01 106.26 78.94 106.78 80.86 107.3 81.08 107.82 80.19 108.35 77.17 108.87 79.12 109.39 82.08 109.91 80.5 110.44 78.48 110.96 77.93 111.48 77.62 112 77.35 112.53 78.06 113.05 78 113.57 78.5 114.09 77.21 114.61 78.04 115.14 78.9 115.66 78.49 116.18 78.9 116.7 76.42 117.23 75.58 117.75 76.93 118.27 75.55 118.79 72.22 119.32 71.57 119.84 70.44 120.36 70.09 120.88 73.61 121.41 72.94 121.93 70.79 122.45 73.21 122.97 75.36 123.5 75.87 124.02 78.45 124.54 78.19 125.06 79.03 125.58 75.53" class="geometry color_" stroke="#BECAB9"/>
        <path fill="none" d="M21.63,61.39 L 22.15 62.55 22.68 62.37 23.2 63.25 23.72 63.25 24.24 64.02 24.77 65.99 25.29 69.66 25.81 71.24 26.33 70.93 26.86 70.19 27.38 71.55 27.9 73.13 28.42 70.7 28.94 73.34 29.47 72.47 29.99 71.56 30.51 71.95 31.03 71.63 31.56 71.16 32.08 73.57 32.6 73.55 33.12 76.27 33.65 73.77 34.17 73.68 34.69 73.68 35.21 76.32 35.74 78.54 36.26 78.59 36.78 78.96 37.3 79.49 37.83 81.13 38.35 81.3 38.87 81.14 39.39 82.98 39.91 80.8 40.44 80.57 40.96 79.64 41.48 81.32 42 78.97 42.53 79.94 43.05 82.18 43.57 81.76 44.09 80.36 44.62 79.69 45.14 78.74 45.66 76.71 46.18 74.35 46.71 73.54 47.23 75.11 47.75 75.3 48.27 72.13 48.8 71.57 49.32 73.81 49.84 70.57 50.36 70.7 50.88 69.51 51.41 67.7 51.93 68.7 52.45 68.49 52.97 67.36 53.5 68.38 54.02 68.57 54.54 69.48 55.06 67.24 55.59 67.91 56.11 68.49 56.63 69.85 57.15 70.98 57.68 72.27 58.2 72.59 58.72 72.89 59.24 71.74 59.77 74.72 60.29 75.85 60.81 76.74 61.33 76.47 61.85 78.94 62.38 80.68 62.9 79.33 63.42 79.29 63.94 80.75 64.47 78.89 64.99 75.99 65.51 76.3 66.03 75.83 66.56 74.26 67.08 73.28 67.6 73.07 68.12 76.32 68.65 79.61 69.17 78.24 69.69 79.84 70.21 78.28 70.74 79.19 71.26 80.4 71.78 82.76 72.3 81.01 72.82 78.82 73.35 80.8 73.87 79.4 74.39 79.97 74.91 79.62 75.44 78.4 75.96 80.89 76.48 80.82 77 80.98 77.53 78.76 78.05 78.89 78.57 78.74 79.09 78.77 79.62 79.58 80.14 80.03 80.66 79.16 81.18 78.87 81.71 77.29 82.23 79.92 82.75 80.48 83.27 76.93 83.79 74.47 84.32 75.54 84.84 73.87 85.36 72.13 85.88 69.8 86.41 70.82 86.93 71.83 87.45 73.26 87.97 72.86 88.5 74.19 89.02 72.37 89.54 70.28 90.06 70.37 90.59 71.36 91.11 69.93 91.63 67.03 92.15 69.87 92.67 66.08 93.2 65.76 93.72 65.11 94.24 65.89 94.76 66.82 95.29 67.4 95.81 66.67 96.33 65.37 96.85 66.11 97.38 66.54 97.9 68.48 98.42 69.86 98.94 66.92 99.47 66.68 99.99 68.42 100.51 71.29 101.03 69.59 101.56 67.99 102.08 67.6 102.6 68.79 103.12 68.83 103.64 72.71 104.17 69.46 104.69 68.62 105.21 64.75 105.73 66.78 106.26 64.76 106.78 67.81 107.3 70.4 107.82 70.97 108.35 72.14 108.87 72.67 109.39 72.77 109.91 74.44 110.44 75.67 110.96 77.33 111.48 76.89 112 75.27 112.53 73.3 113.05 75.32 113.57 74.37 114.09 76.24 114.61 75.89 115.14 72.65 115.66 72.29 116.18 70.49 116.7 71.87 117.23 69.1 117.75 70.16 118.27 66.35 118.79 65.95 119.32 67.92 119.84 67.88 120.36 68.62 120.88 69.89 121.41 68.68 121.93 65.93 122.45 64.6 122.97 64.63 123.5 64.11 124.02 65.81 124.54 63.74 125.06 61.66 125.58 61.11" class="geometry color_" stroke="#D2B497"/>
      </g>
    </g>
    <g opacity="0" class="guide zoomslider" stroke="#000000" stroke-opacity="0.000" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-15">
      <g fill="#EAEAEA" stroke-width="0.3" stroke-opacity="0" stroke="#6A6A6A" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-16">
        <rect x="120.58" y="8" width="4" height="4"/>
        <g class="button_logo" fill="#6A6A6A" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-17">
          <path d="M121.38,9.6 L 122.18 9.6 122.18 8.8 122.98 8.8 122.98 9.6 123.78 9.6 123.78 10.4 122.98 10.4 122.98 11.2 122.18 11.2 122.18 10.4 121.38 10.4 z"/>
        </g>
      </g>
      <g fill="#EAEAEA" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-18">
        <rect x="101.08" y="8" width="19" height="4"/>
      </g>
      <g class="zoomslider_thumb" fill="#6A6A6A" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-19">
        <rect x="109.58" y="8" width="2" height="4"/>
      </g>
      <g fill="#EAEAEA" stroke-width="0.3" stroke-opacity="0" stroke="#6A6A6A" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-20">
        <rect x="96.58" y="8" width="4" height="4"/>
        <g class="button_logo" fill="#6A6A6A" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-21">
          <path d="M97.38,9.6 L 99.78 9.6 99.78 10.4 97.38 10.4 z"/>
        </g>
      </g>
    </g>
  </g>
  <g class="guide ylabels" font-size="2.82" font-family="'PT Sans Caption','Helvetica Neue','Helvetica',sans-serif" fill="#6C606B" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-22">
    <text x="18.63" y="175.05" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">65</text>
    <text x="18.63" y="159.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">70</text>
    <text x="18.63" y="144.5" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">75</text>
    <text x="18.63" y="129.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">80</text>
    <text x="18.63" y="113.94" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">85</text>
    <text x="18.63" y="98.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">90</text>
    <text x="18.63" y="83.39" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">95</text>
    <text x="18.63" y="68.11" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">100</text>
    <text x="18.63" y="52.83" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">105</text>
    <text x="18.63" y="37.56" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">110</text>
    <text x="18.63" y="22.28" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">115</text>
    <text x="18.63" y="7" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">120</text>
    <text x="18.63" y="-8.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">125</text>
    <text x="18.63" y="-23.56" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">130</text>
    <text x="18.63" y="-38.83" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">135</text>
    <text x="18.63" y="-54.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">140</text>
    <text x="18.63" y="-69.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">145</text>
    <text x="18.63" y="-84.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">150</text>
    <text x="18.63" y="159.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">70</text>
    <text x="18.63" y="156.72" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">71</text>
    <text x="18.63" y="153.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">72</text>
    <text x="18.63" y="150.61" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">73</text>
    <text x="18.63" y="147.55" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">74</text>
    <text x="18.63" y="144.5" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">75</text>
    <text x="18.63" y="141.44" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">76</text>
    <text x="18.63" y="138.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">77</text>
    <text x="18.63" y="135.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">78</text>
    <text x="18.63" y="132.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">79</text>
    <text x="18.63" y="129.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">80</text>
    <text x="18.63" y="126.17" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">81</text>
    <text x="18.63" y="123.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">82</text>
    <text x="18.63" y="120.05" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">83</text>
    <text x="18.63" y="117" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">84</text>
    <text x="18.63" y="113.94" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">85</text>
    <text x="18.63" y="110.89" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">86</text>
    <text x="18.63" y="107.83" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">87</text>
    <text x="18.63" y="104.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">88</text>
    <text x="18.63" y="101.72" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">89</text>
    <text x="18.63" y="98.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">90</text>
    <text x="18.63" y="95.61" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">91</text>
    <text x="18.63" y="92.55" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">92</text>
    <text x="18.63" y="89.5" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">93</text>
    <text x="18.63" y="86.44" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">94</text>
    <text x="18.63" y="83.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">95</text>
    <text x="18.63" y="80.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">96</text>
    <text x="18.63" y="77.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">97</text>
    <text x="18.63" y="74.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">98</text>
    <text x="18.63" y="71.17" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">99</text>
    <text x="18.63" y="68.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">100</text>
    <text x="18.63" y="65.06" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">101</text>
    <text x="18.63" y="62" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">102</text>
    <text x="18.63" y="58.94" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">103</text>
    <text x="18.63" y="55.89" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">104</text>
    <text x="18.63" y="52.83" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">105</text>
    <text x="18.63" y="49.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">106</text>
    <text x="18.63" y="46.72" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">107</text>
    <text x="18.63" y="43.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">108</text>
    <text x="18.63" y="40.61" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">109</text>
    <text x="18.63" y="37.56" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">110</text>
    <text x="18.63" y="34.5" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">111</text>
    <text x="18.63" y="31.44" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">112</text>
    <text x="18.63" y="28.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">113</text>
    <text x="18.63" y="25.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">114</text>
    <text x="18.63" y="22.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">115</text>
    <text x="18.63" y="19.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">116</text>
    <text x="18.63" y="16.17" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">117</text>
    <text x="18.63" y="13.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">118</text>
    <text x="18.63" y="10.06" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">119</text>
    <text x="18.63" y="7" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">120</text>
    <text x="18.63" y="3.94" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">121</text>
    <text x="18.63" y="0.89" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">122</text>
    <text x="18.63" y="-2.17" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">123</text>
    <text x="18.63" y="-5.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">124</text>
    <text x="18.63" y="-8.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">125</text>
    <text x="18.63" y="-11.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">126</text>
    <text x="18.63" y="-14.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">127</text>
    <text x="18.63" y="-17.44" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">128</text>
    <text x="18.63" y="-20.5" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">129</text>
    <text x="18.63" y="-23.56" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">130</text>
    <text x="18.63" y="-26.61" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">131</text>
    <text x="18.63" y="-29.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">132</text>
    <text x="18.63" y="-32.72" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">133</text>
    <text x="18.63" y="-35.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">134</text>
    <text x="18.63" y="-38.83" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">135</text>
    <text x="18.63" y="-41.89" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">136</text>
    <text x="18.63" y="-44.94" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">137</text>
    <text x="18.63" y="-48" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">138</text>
    <text x="18.63" y="-51.06" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">139</text>
    <text x="18.63" y="-54.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">140</text>
    <text x="18.63" y="-57.17" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">141</text>
    <text x="18.63" y="-60.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">142</text>
    <text x="18.63" y="-63.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">143</text>
    <text x="18.63" y="-66.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">144</text>
    <text x="18.63" y="-69.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">145</text>
    <text x="18.63" y="220.89" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="0.5">50</text>
    <text x="18.63" y="68.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="0.5">100</text>
    <text x="18.63" y="-84.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="0.5">150</text>
    <text x="18.63" y="159.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">70</text>
    <text x="18.63" y="153.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">72</text>
    <text x="18.63" y="147.55" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">74</text>
    <text x="18.63" y="141.44" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">76</text>
    <text x="18.63" y="135.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">78</text>
    <text x="18.63" y="129.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">80</text>
    <text x="18.63" y="123.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">82</text>
    <text x="18.63" y="117" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">84</text>
    <text x="18.63" y="110.89" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">86</text>
    <text x="18.63" y="104.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">88</text>
    <text x="18.63" y="98.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">90</text>
    <text x="18.63" y="92.55" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">92</text>
    <text x="18.63" y="86.44" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">94</text>
    <text x="18.63" y="80.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">96</text>
    <text x="18.63" y="74.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">98</text>
    <text x="18.63" y="68.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">100</text>
    <text x="18.63" y="62" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">102</text>
    <text x="18.63" y="55.89" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">104</text>
    <text x="18.63" y="49.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">106</text>
    <text x="18.63" y="43.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">108</text>
    <text x="18.63" y="37.56" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">110</text>
    <text x="18.63" y="31.44" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">112</text>
    <text x="18.63" y="25.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">114</text>
    <text x="18.63" y="19.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">116</text>
    <text x="18.63" y="13.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">118</text>
    <text x="18.63" y="7" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">120</text>
    <text x="18.63" y="0.89" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">122</text>
    <text x="18.63" y="-5.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">124</text>
    <text x="18.63" y="-11.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">126</text>
    <text x="18.63" y="-17.44" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">128</text>
    <text x="18.63" y="-23.56" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">130</text>
    <text x="18.63" y="-29.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">132</text>
    <text x="18.63" y="-35.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">134</text>
    <text x="18.63" y="-41.89" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">136</text>
    <text x="18.63" y="-48" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">138</text>
    <text x="18.63" y="-54.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">140</text>
    <text x="18.63" y="-60.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">142</text>
    <text x="18.63" y="-66.33" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">144</text>
    <text x="18.63" y="-72.44" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">146</text>
  </g>
  <g font-size="3.88" font-family="'PT Sans','Helvetica Neue','Helvetica',sans-serif" fill="#564A55" stroke="#000000" stroke-opacity="0.000" id="fig-3a6dd25ad25c4037a166889ee51bb151-element-23">
    <text x="8.81" y="43.19" text-anchor="middle" dy="0.35em" transform="rotate(-90, 8.81, 45.19)">Value</text>
  </g>
</g>
<defs>
<clipPath id="fig-3a6dd25ad25c4037a166889ee51bb151-element-9">
  <path d="M19.63,5 L 127.58 5 127.58 85.39 19.63 85.39" />
</clipPath
></defs>
<script> <![CDATA[
(function(N){var k=/[\.\/]/,L=/\s*,\s*/,C=function(a,d){return a-d},a,v,y={n:{}},M=function(){for(var a=0,d=this.length;a<d;a++)if("undefined"!=typeof this[a])return this[a]},A=function(){for(var a=this.length;--a;)if("undefined"!=typeof this[a])return this[a]},w=function(k,d){k=String(k);var f=v,n=Array.prototype.slice.call(arguments,2),u=w.listeners(k),p=0,b,q=[],e={},l=[],r=a;l.firstDefined=M;l.lastDefined=A;a=k;for(var s=v=0,x=u.length;s<x;s++)"zIndex"in u[s]&&(q.push(u[s].zIndex),0>u[s].zIndex&&
(e[u[s].zIndex]=u[s]));for(q.sort(C);0>q[p];)if(b=e[q[p++] ],l.push(b.apply(d,n)),v)return v=f,l;for(s=0;s<x;s++)if(b=u[s],"zIndex"in b)if(b.zIndex==q[p]){l.push(b.apply(d,n));if(v)break;do if(p++,(b=e[q[p] ])&&l.push(b.apply(d,n)),v)break;while(b)}else e[b.zIndex]=b;else if(l.push(b.apply(d,n)),v)break;v=f;a=r;return l};w._events=y;w.listeners=function(a){a=a.split(k);var d=y,f,n,u,p,b,q,e,l=[d],r=[];u=0;for(p=a.length;u<p;u++){e=[];b=0;for(q=l.length;b<q;b++)for(d=l[b].n,f=[d[a[u] ],d["*"] ],n=2;n--;)if(d=
f[n])e.push(d),r=r.concat(d.f||[]);l=e}return r};w.on=function(a,d){a=String(a);if("function"!=typeof d)return function(){};for(var f=a.split(L),n=0,u=f.length;n<u;n++)(function(a){a=a.split(k);for(var b=y,f,e=0,l=a.length;e<l;e++)b=b.n,b=b.hasOwnProperty(a[e])&&b[a[e] ]||(b[a[e] ]={n:{}});b.f=b.f||[];e=0;for(l=b.f.length;e<l;e++)if(b.f[e]==d){f=!0;break}!f&&b.f.push(d)})(f[n]);return function(a){+a==+a&&(d.zIndex=+a)}};w.f=function(a){var d=[].slice.call(arguments,1);return function(){w.apply(null,
[a,null].concat(d).concat([].slice.call(arguments,0)))}};w.stop=function(){v=1};w.nt=function(k){return k?(new RegExp("(?:\\.|\\/|^)"+k+"(?:\\.|\\/|$)")).test(a):a};w.nts=function(){return a.split(k)};w.off=w.unbind=function(a,d){if(a){var f=a.split(L);if(1<f.length)for(var n=0,u=f.length;n<u;n++)w.off(f[n],d);else{for(var f=a.split(k),p,b,q,e,l=[y],n=0,u=f.length;n<u;n++)for(e=0;e<l.length;e+=q.length-2){q=[e,1];p=l[e].n;if("*"!=f[n])p[f[n] ]&&q.push(p[f[n] ]);else for(b in p)p.hasOwnProperty(b)&&
q.push(p[b]);l.splice.apply(l,q)}n=0;for(u=l.length;n<u;n++)for(p=l[n];p.n;){if(d){if(p.f){e=0;for(f=p.f.length;e<f;e++)if(p.f[e]==d){p.f.splice(e,1);break}!p.f.length&&delete p.f}for(b in p.n)if(p.n.hasOwnProperty(b)&&p.n[b].f){q=p.n[b].f;e=0;for(f=q.length;e<f;e++)if(q[e]==d){q.splice(e,1);break}!q.length&&delete p.n[b].f}}else for(b in delete p.f,p.n)p.n.hasOwnProperty(b)&&p.n[b].f&&delete p.n[b].f;p=p.n}}}else w._events=y={n:{}}};w.once=function(a,d){var f=function(){w.unbind(a,f);return d.apply(this,
arguments)};return w.on(a,f)};w.version="0.4.2";w.toString=function(){return"You are running Eve 0.4.2"};"undefined"!=typeof module&&module.exports?module.exports=w:"function"===typeof define&&define.amd?define("eve",[],function(){return w}):N.eve=w})(this);
(function(N,k){"function"===typeof define&&define.amd?define("Snap.svg",["eve"],function(L){return k(N,L)}):k(N,N.eve)})(this,function(N,k){var L=function(a){var k={},y=N.requestAnimationFrame||N.webkitRequestAnimationFrame||N.mozRequestAnimationFrame||N.oRequestAnimationFrame||N.msRequestAnimationFrame||function(a){setTimeout(a,16)},M=Array.isArray||function(a){return a instanceof Array||"[object Array]"==Object.prototype.toString.call(a)},A=0,w="M"+(+new Date).toString(36),z=function(a){if(null==
a)return this.s;var b=this.s-a;this.b+=this.dur*b;this.B+=this.dur*b;this.s=a},d=function(a){if(null==a)return this.spd;this.spd=a},f=function(a){if(null==a)return this.dur;this.s=this.s*a/this.dur;this.dur=a},n=function(){delete k[this.id];this.update();a("mina.stop."+this.id,this)},u=function(){this.pdif||(delete k[this.id],this.update(),this.pdif=this.get()-this.b)},p=function(){this.pdif&&(this.b=this.get()-this.pdif,delete this.pdif,k[this.id]=this)},b=function(){var a;if(M(this.start)){a=[];
for(var b=0,e=this.start.length;b<e;b++)a[b]=+this.start[b]+(this.end[b]-this.start[b])*this.easing(this.s)}else a=+this.start+(this.end-this.start)*this.easing(this.s);this.set(a)},q=function(){var l=0,b;for(b in k)if(k.hasOwnProperty(b)){var e=k[b],f=e.get();l++;e.s=(f-e.b)/(e.dur/e.spd);1<=e.s&&(delete k[b],e.s=1,l--,function(b){setTimeout(function(){a("mina.finish."+b.id,b)})}(e));e.update()}l&&y(q)},e=function(a,r,s,x,G,h,J){a={id:w+(A++).toString(36),start:a,end:r,b:s,s:0,dur:x-s,spd:1,get:G,
set:h,easing:J||e.linear,status:z,speed:d,duration:f,stop:n,pause:u,resume:p,update:b};k[a.id]=a;r=0;for(var K in k)if(k.hasOwnProperty(K)&&(r++,2==r))break;1==r&&y(q);return a};e.time=Date.now||function(){return+new Date};e.getById=function(a){return k[a]||null};e.linear=function(a){return a};e.easeout=function(a){return Math.pow(a,1.7)};e.easein=function(a){return Math.pow(a,0.48)};e.easeinout=function(a){if(1==a)return 1;if(0==a)return 0;var b=0.48-a/1.04,e=Math.sqrt(0.1734+b*b);a=e-b;a=Math.pow(Math.abs(a),
1/3)*(0>a?-1:1);b=-e-b;b=Math.pow(Math.abs(b),1/3)*(0>b?-1:1);a=a+b+0.5;return 3*(1-a)*a*a+a*a*a};e.backin=function(a){return 1==a?1:a*a*(2.70158*a-1.70158)};e.backout=function(a){if(0==a)return 0;a-=1;return a*a*(2.70158*a+1.70158)+1};e.elastic=function(a){return a==!!a?a:Math.pow(2,-10*a)*Math.sin(2*(a-0.075)*Math.PI/0.3)+1};e.bounce=function(a){a<1/2.75?a*=7.5625*a:a<2/2.75?(a-=1.5/2.75,a=7.5625*a*a+0.75):a<2.5/2.75?(a-=2.25/2.75,a=7.5625*a*a+0.9375):(a-=2.625/2.75,a=7.5625*a*a+0.984375);return a};
return N.mina=e}("undefined"==typeof k?function(){}:k),C=function(){function a(c,t){if(c){if(c.tagName)return x(c);if(y(c,"array")&&a.set)return a.set.apply(a,c);if(c instanceof e)return c;if(null==t)return c=G.doc.querySelector(c),x(c)}return new s(null==c?"100%":c,null==t?"100%":t)}function v(c,a){if(a){"#text"==c&&(c=G.doc.createTextNode(a.text||""));"string"==typeof c&&(c=v(c));if("string"==typeof a)return"xlink:"==a.substring(0,6)?c.getAttributeNS(m,a.substring(6)):"xml:"==a.substring(0,4)?c.getAttributeNS(la,
a.substring(4)):c.getAttribute(a);for(var da in a)if(a[h](da)){var b=J(a[da]);b?"xlink:"==da.substring(0,6)?c.setAttributeNS(m,da.substring(6),b):"xml:"==da.substring(0,4)?c.setAttributeNS(la,da.substring(4),b):c.setAttribute(da,b):c.removeAttribute(da)}}else c=G.doc.createElementNS(la,c);return c}function y(c,a){a=J.prototype.toLowerCase.call(a);return"finite"==a?isFinite(c):"array"==a&&(c instanceof Array||Array.isArray&&Array.isArray(c))?!0:"null"==a&&null===c||a==typeof c&&null!==c||"object"==
a&&c===Object(c)||$.call(c).slice(8,-1).toLowerCase()==a}function M(c){if("function"==typeof c||Object(c)!==c)return c;var a=new c.constructor,b;for(b in c)c[h](b)&&(a[b]=M(c[b]));return a}function A(c,a,b){function m(){var e=Array.prototype.slice.call(arguments,0),f=e.join("\u2400"),d=m.cache=m.cache||{},l=m.count=m.count||[];if(d[h](f)){a:for(var e=l,l=f,B=0,H=e.length;B<H;B++)if(e[B]===l){e.push(e.splice(B,1)[0]);break a}return b?b(d[f]):d[f]}1E3<=l.length&&delete d[l.shift()];l.push(f);d[f]=c.apply(a,
e);return b?b(d[f]):d[f]}return m}function w(c,a,b,m,e,f){return null==e?(c-=b,a-=m,c||a?(180*I.atan2(-a,-c)/C+540)%360:0):w(c,a,e,f)-w(b,m,e,f)}function z(c){return c%360*C/180}function d(c){var a=[];c=c.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g,function(c,b,m){m=m.split(/\s*,\s*|\s+/);"rotate"==b&&1==m.length&&m.push(0,0);"scale"==b&&(2<m.length?m=m.slice(0,2):2==m.length&&m.push(0,0),1==m.length&&m.push(m[0],0,0));"skewX"==b?a.push(["m",1,0,I.tan(z(m[0])),1,0,0]):"skewY"==b?a.push(["m",1,I.tan(z(m[0])),
0,1,0,0]):a.push([b.charAt(0)].concat(m));return c});return a}function f(c,t){var b=O(c),m=new a.Matrix;if(b)for(var e=0,f=b.length;e<f;e++){var h=b[e],d=h.length,B=J(h[0]).toLowerCase(),H=h[0]!=B,l=H?m.invert():0,E;"t"==B&&2==d?m.translate(h[1],0):"t"==B&&3==d?H?(d=l.x(0,0),B=l.y(0,0),H=l.x(h[1],h[2]),l=l.y(h[1],h[2]),m.translate(H-d,l-B)):m.translate(h[1],h[2]):"r"==B?2==d?(E=E||t,m.rotate(h[1],E.x+E.width/2,E.y+E.height/2)):4==d&&(H?(H=l.x(h[2],h[3]),l=l.y(h[2],h[3]),m.rotate(h[1],H,l)):m.rotate(h[1],
h[2],h[3])):"s"==B?2==d||3==d?(E=E||t,m.scale(h[1],h[d-1],E.x+E.width/2,E.y+E.height/2)):4==d?H?(H=l.x(h[2],h[3]),l=l.y(h[2],h[3]),m.scale(h[1],h[1],H,l)):m.scale(h[1],h[1],h[2],h[3]):5==d&&(H?(H=l.x(h[3],h[4]),l=l.y(h[3],h[4]),m.scale(h[1],h[2],H,l)):m.scale(h[1],h[2],h[3],h[4])):"m"==B&&7==d&&m.add(h[1],h[2],h[3],h[4],h[5],h[6])}return m}function n(c,t){if(null==t){var m=!0;t="linearGradient"==c.type||"radialGradient"==c.type?c.node.getAttribute("gradientTransform"):"pattern"==c.type?c.node.getAttribute("patternTransform"):
c.node.getAttribute("transform");if(!t)return new a.Matrix;t=d(t)}else t=a._.rgTransform.test(t)?J(t).replace(/\.{3}|\u2026/g,c._.transform||aa):d(t),y(t,"array")&&(t=a.path?a.path.toString.call(t):J(t)),c._.transform=t;var b=f(t,c.getBBox(1));if(m)return b;c.matrix=b}function u(c){c=c.node.ownerSVGElement&&x(c.node.ownerSVGElement)||c.node.parentNode&&x(c.node.parentNode)||a.select("svg")||a(0,0);var t=c.select("defs"),t=null==t?!1:t.node;t||(t=r("defs",c.node).node);return t}function p(c){return c.node.ownerSVGElement&&
x(c.node.ownerSVGElement)||a.select("svg")}function b(c,a,m){function b(c){if(null==c)return aa;if(c==+c)return c;v(B,{width:c});try{return B.getBBox().width}catch(a){return 0}}function h(c){if(null==c)return aa;if(c==+c)return c;v(B,{height:c});try{return B.getBBox().height}catch(a){return 0}}function e(b,B){null==a?d[b]=B(c.attr(b)||0):b==a&&(d=B(null==m?c.attr(b)||0:m))}var f=p(c).node,d={},B=f.querySelector(".svg---mgr");B||(B=v("rect"),v(B,{x:-9E9,y:-9E9,width:10,height:10,"class":"svg---mgr",
fill:"none"}),f.appendChild(B));switch(c.type){case "rect":e("rx",b),e("ry",h);case "image":e("width",b),e("height",h);case "text":e("x",b);e("y",h);break;case "circle":e("cx",b);e("cy",h);e("r",b);break;case "ellipse":e("cx",b);e("cy",h);e("rx",b);e("ry",h);break;case "line":e("x1",b);e("x2",b);e("y1",h);e("y2",h);break;case "marker":e("refX",b);e("markerWidth",b);e("refY",h);e("markerHeight",h);break;case "radialGradient":e("fx",b);e("fy",h);break;case "tspan":e("dx",b);e("dy",h);break;default:e(a,
b)}f.removeChild(B);return d}function q(c){y(c,"array")||(c=Array.prototype.slice.call(arguments,0));for(var a=0,b=0,m=this.node;this[a];)delete this[a++];for(a=0;a<c.length;a++)"set"==c[a].type?c[a].forEach(function(c){m.appendChild(c.node)}):m.appendChild(c[a].node);for(var h=m.childNodes,a=0;a<h.length;a++)this[b++]=x(h[a]);return this}function e(c){if(c.snap in E)return E[c.snap];var a=this.id=V(),b;try{b=c.ownerSVGElement}catch(m){}this.node=c;b&&(this.paper=new s(b));this.type=c.tagName;this.anims=
{};this._={transform:[]};c.snap=a;E[a]=this;"g"==this.type&&(this.add=q);if(this.type in{g:1,mask:1,pattern:1})for(var e in s.prototype)s.prototype[h](e)&&(this[e]=s.prototype[e])}function l(c){this.node=c}function r(c,a){var b=v(c);a.appendChild(b);return x(b)}function s(c,a){var b,m,f,d=s.prototype;if(c&&"svg"==c.tagName){if(c.snap in E)return E[c.snap];var l=c.ownerDocument;b=new e(c);m=c.getElementsByTagName("desc")[0];f=c.getElementsByTagName("defs")[0];m||(m=v("desc"),m.appendChild(l.createTextNode("Created with Snap")),
b.node.appendChild(m));f||(f=v("defs"),b.node.appendChild(f));b.defs=f;for(var ca in d)d[h](ca)&&(b[ca]=d[ca]);b.paper=b.root=b}else b=r("svg",G.doc.body),v(b.node,{height:a,version:1.1,width:c,xmlns:la});return b}function x(c){return!c||c instanceof e||c instanceof l?c:c.tagName&&"svg"==c.tagName.toLowerCase()?new s(c):c.tagName&&"object"==c.tagName.toLowerCase()&&"image/svg+xml"==c.type?new s(c.contentDocument.getElementsByTagName("svg")[0]):new e(c)}a.version="0.3.0";a.toString=function(){return"Snap v"+
this.version};a._={};var G={win:N,doc:N.document};a._.glob=G;var h="hasOwnProperty",J=String,K=parseFloat,U=parseInt,I=Math,P=I.max,Q=I.min,Y=I.abs,C=I.PI,aa="",$=Object.prototype.toString,F=/^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i;a._.separator=
RegExp("[,\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]+");var S=RegExp("[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*"),X={hs:1,rg:1},W=RegExp("([a-z])[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)",
"ig"),ma=RegExp("([rstm])[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)","ig"),Z=RegExp("(-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?)[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*",
"ig"),na=0,ba="S"+(+new Date).toString(36),V=function(){return ba+(na++).toString(36)},m="http://www.w3.org/1999/xlink",la="http://www.w3.org/2000/svg",E={},ca=a.url=function(c){return"url('#"+c+"')"};a._.$=v;a._.id=V;a.format=function(){var c=/\{([^\}]+)\}/g,a=/(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,b=function(c,b,m){var h=m;b.replace(a,function(c,a,b,m,t){a=a||m;h&&(a in h&&(h=h[a]),"function"==typeof h&&t&&(h=h()))});return h=(null==h||h==m?c:h)+""};return function(a,m){return J(a).replace(c,
function(c,a){return b(c,a,m)})}}();a._.clone=M;a._.cacher=A;a.rad=z;a.deg=function(c){return 180*c/C%360};a.angle=w;a.is=y;a.snapTo=function(c,a,b){b=y(b,"finite")?b:10;if(y(c,"array"))for(var m=c.length;m--;){if(Y(c[m]-a)<=b)return c[m]}else{c=+c;m=a%c;if(m<b)return a-m;if(m>c-b)return a-m+c}return a};a.getRGB=A(function(c){if(!c||(c=J(c)).indexOf("-")+1)return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:ka};if("none"==c)return{r:-1,g:-1,b:-1,hex:"none",toString:ka};!X[h](c.toLowerCase().substring(0,
2))&&"#"!=c.charAt()&&(c=T(c));if(!c)return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:ka};var b,m,e,f,d;if(c=c.match(F)){c[2]&&(e=U(c[2].substring(5),16),m=U(c[2].substring(3,5),16),b=U(c[2].substring(1,3),16));c[3]&&(e=U((d=c[3].charAt(3))+d,16),m=U((d=c[3].charAt(2))+d,16),b=U((d=c[3].charAt(1))+d,16));c[4]&&(d=c[4].split(S),b=K(d[0]),"%"==d[0].slice(-1)&&(b*=2.55),m=K(d[1]),"%"==d[1].slice(-1)&&(m*=2.55),e=K(d[2]),"%"==d[2].slice(-1)&&(e*=2.55),"rgba"==c[1].toLowerCase().slice(0,4)&&(f=K(d[3])),
d[3]&&"%"==d[3].slice(-1)&&(f/=100));if(c[5])return d=c[5].split(S),b=K(d[0]),"%"==d[0].slice(-1)&&(b/=100),m=K(d[1]),"%"==d[1].slice(-1)&&(m/=100),e=K(d[2]),"%"==d[2].slice(-1)&&(e/=100),"deg"!=d[0].slice(-3)&&"\u00b0"!=d[0].slice(-1)||(b/=360),"hsba"==c[1].toLowerCase().slice(0,4)&&(f=K(d[3])),d[3]&&"%"==d[3].slice(-1)&&(f/=100),a.hsb2rgb(b,m,e,f);if(c[6])return d=c[6].split(S),b=K(d[0]),"%"==d[0].slice(-1)&&(b/=100),m=K(d[1]),"%"==d[1].slice(-1)&&(m/=100),e=K(d[2]),"%"==d[2].slice(-1)&&(e/=100),
"deg"!=d[0].slice(-3)&&"\u00b0"!=d[0].slice(-1)||(b/=360),"hsla"==c[1].toLowerCase().slice(0,4)&&(f=K(d[3])),d[3]&&"%"==d[3].slice(-1)&&(f/=100),a.hsl2rgb(b,m,e,f);b=Q(I.round(b),255);m=Q(I.round(m),255);e=Q(I.round(e),255);f=Q(P(f,0),1);c={r:b,g:m,b:e,toString:ka};c.hex="#"+(16777216|e|m<<8|b<<16).toString(16).slice(1);c.opacity=y(f,"finite")?f:1;return c}return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:ka}},a);a.hsb=A(function(c,b,m){return a.hsb2rgb(c,b,m).hex});a.hsl=A(function(c,b,m){return a.hsl2rgb(c,
b,m).hex});a.rgb=A(function(c,a,b,m){if(y(m,"finite")){var e=I.round;return"rgba("+[e(c),e(a),e(b),+m.toFixed(2)]+")"}return"#"+(16777216|b|a<<8|c<<16).toString(16).slice(1)});var T=function(c){var a=G.doc.getElementsByTagName("head")[0]||G.doc.getElementsByTagName("svg")[0];T=A(function(c){if("red"==c.toLowerCase())return"rgb(255, 0, 0)";a.style.color="rgb(255, 0, 0)";a.style.color=c;c=G.doc.defaultView.getComputedStyle(a,aa).getPropertyValue("color");return"rgb(255, 0, 0)"==c?null:c});return T(c)},
qa=function(){return"hsb("+[this.h,this.s,this.b]+")"},ra=function(){return"hsl("+[this.h,this.s,this.l]+")"},ka=function(){return 1==this.opacity||null==this.opacity?this.hex:"rgba("+[this.r,this.g,this.b,this.opacity]+")"},D=function(c,b,m){null==b&&y(c,"object")&&"r"in c&&"g"in c&&"b"in c&&(m=c.b,b=c.g,c=c.r);null==b&&y(c,string)&&(m=a.getRGB(c),c=m.r,b=m.g,m=m.b);if(1<c||1<b||1<m)c/=255,b/=255,m/=255;return[c,b,m]},oa=function(c,b,m,e){c=I.round(255*c);b=I.round(255*b);m=I.round(255*m);c={r:c,
g:b,b:m,opacity:y(e,"finite")?e:1,hex:a.rgb(c,b,m),toString:ka};y(e,"finite")&&(c.opacity=e);return c};a.color=function(c){var b;y(c,"object")&&"h"in c&&"s"in c&&"b"in c?(b=a.hsb2rgb(c),c.r=b.r,c.g=b.g,c.b=b.b,c.opacity=1,c.hex=b.hex):y(c,"object")&&"h"in c&&"s"in c&&"l"in c?(b=a.hsl2rgb(c),c.r=b.r,c.g=b.g,c.b=b.b,c.opacity=1,c.hex=b.hex):(y(c,"string")&&(c=a.getRGB(c)),y(c,"object")&&"r"in c&&"g"in c&&"b"in c&&!("error"in c)?(b=a.rgb2hsl(c),c.h=b.h,c.s=b.s,c.l=b.l,b=a.rgb2hsb(c),c.v=b.b):(c={hex:"none"},
c.r=c.g=c.b=c.h=c.s=c.v=c.l=-1,c.error=1));c.toString=ka;return c};a.hsb2rgb=function(c,a,b,m){y(c,"object")&&"h"in c&&"s"in c&&"b"in c&&(b=c.b,a=c.s,c=c.h,m=c.o);var e,h,d;c=360*c%360/60;d=b*a;a=d*(1-Y(c%2-1));b=e=h=b-d;c=~~c;b+=[d,a,0,0,a,d][c];e+=[a,d,d,a,0,0][c];h+=[0,0,a,d,d,a][c];return oa(b,e,h,m)};a.hsl2rgb=function(c,a,b,m){y(c,"object")&&"h"in c&&"s"in c&&"l"in c&&(b=c.l,a=c.s,c=c.h);if(1<c||1<a||1<b)c/=360,a/=100,b/=100;var e,h,d;c=360*c%360/60;d=2*a*(0.5>b?b:1-b);a=d*(1-Y(c%2-1));b=e=
h=b-d/2;c=~~c;b+=[d,a,0,0,a,d][c];e+=[a,d,d,a,0,0][c];h+=[0,0,a,d,d,a][c];return oa(b,e,h,m)};a.rgb2hsb=function(c,a,b){b=D(c,a,b);c=b[0];a=b[1];b=b[2];var m,e;m=P(c,a,b);e=m-Q(c,a,b);c=((0==e?0:m==c?(a-b)/e:m==a?(b-c)/e+2:(c-a)/e+4)+360)%6*60/360;return{h:c,s:0==e?0:e/m,b:m,toString:qa}};a.rgb2hsl=function(c,a,b){b=D(c,a,b);c=b[0];a=b[1];b=b[2];var m,e,h;m=P(c,a,b);e=Q(c,a,b);h=m-e;c=((0==h?0:m==c?(a-b)/h:m==a?(b-c)/h+2:(c-a)/h+4)+360)%6*60/360;m=(m+e)/2;return{h:c,s:0==h?0:0.5>m?h/(2*m):h/(2-2*
m),l:m,toString:ra}};a.parsePathString=function(c){if(!c)return null;var b=a.path(c);if(b.arr)return a.path.clone(b.arr);var m={a:7,c:6,o:2,h:1,l:2,m:2,r:4,q:4,s:4,t:2,v:1,u:3,z:0},e=[];y(c,"array")&&y(c[0],"array")&&(e=a.path.clone(c));e.length||J(c).replace(W,function(c,a,b){var h=[];c=a.toLowerCase();b.replace(Z,function(c,a){a&&h.push(+a)});"m"==c&&2<h.length&&(e.push([a].concat(h.splice(0,2))),c="l",a="m"==a?"l":"L");"o"==c&&1==h.length&&e.push([a,h[0] ]);if("r"==c)e.push([a].concat(h));else for(;h.length>=
m[c]&&(e.push([a].concat(h.splice(0,m[c]))),m[c]););});e.toString=a.path.toString;b.arr=a.path.clone(e);return e};var O=a.parseTransformString=function(c){if(!c)return null;var b=[];y(c,"array")&&y(c[0],"array")&&(b=a.path.clone(c));b.length||J(c).replace(ma,function(c,a,m){var e=[];a.toLowerCase();m.replace(Z,function(c,a){a&&e.push(+a)});b.push([a].concat(e))});b.toString=a.path.toString;return b};a._.svgTransform2string=d;a._.rgTransform=RegExp("^[a-z][\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*-?\\.?\\d",
"i");a._.transform2matrix=f;a._unit2px=b;a._.getSomeDefs=u;a._.getSomeSVG=p;a.select=function(c){return x(G.doc.querySelector(c))};a.selectAll=function(c){c=G.doc.querySelectorAll(c);for(var b=(a.set||Array)(),m=0;m<c.length;m++)b.push(x(c[m]));return b};setInterval(function(){for(var c in E)if(E[h](c)){var a=E[c],b=a.node;("svg"!=a.type&&!b.ownerSVGElement||"svg"==a.type&&(!b.parentNode||"ownerSVGElement"in b.parentNode&&!b.ownerSVGElement))&&delete E[c]}},1E4);(function(c){function m(c){function a(c,
b){var m=v(c.node,b);(m=(m=m&&m.match(d))&&m[2])&&"#"==m.charAt()&&(m=m.substring(1))&&(f[m]=(f[m]||[]).concat(function(a){var m={};m[b]=ca(a);v(c.node,m)}))}function b(c){var a=v(c.node,"xlink:href");a&&"#"==a.charAt()&&(a=a.substring(1))&&(f[a]=(f[a]||[]).concat(function(a){c.attr("xlink:href","#"+a)}))}var e=c.selectAll("*"),h,d=/^\s*url\(("|'|)(.*)\1\)\s*$/;c=[];for(var f={},l=0,E=e.length;l<E;l++){h=e[l];a(h,"fill");a(h,"stroke");a(h,"filter");a(h,"mask");a(h,"clip-path");b(h);var t=v(h.node,
"id");t&&(v(h.node,{id:h.id}),c.push({old:t,id:h.id}))}l=0;for(E=c.length;l<E;l++)if(e=f[c[l].old])for(h=0,t=e.length;h<t;h++)e[h](c[l].id)}function e(c,a,b){return function(m){m=m.slice(c,a);1==m.length&&(m=m[0]);return b?b(m):m}}function d(c){return function(){var a=c?"<"+this.type:"",b=this.node.attributes,m=this.node.childNodes;if(c)for(var e=0,h=b.length;e<h;e++)a+=" "+b[e].name+'="'+b[e].value.replace(/"/g,'\\"')+'"';if(m.length){c&&(a+=">");e=0;for(h=m.length;e<h;e++)3==m[e].nodeType?a+=m[e].nodeValue:
1==m[e].nodeType&&(a+=x(m[e]).toString());c&&(a+="</"+this.type+">")}else c&&(a+="/>");return a}}c.attr=function(c,a){if(!c)return this;if(y(c,"string"))if(1<arguments.length){var b={};b[c]=a;c=b}else return k("snap.util.getattr."+c,this).firstDefined();for(var m in c)c[h](m)&&k("snap.util.attr."+m,this,c[m]);return this};c.getBBox=function(c){if(!a.Matrix||!a.path)return this.node.getBBox();var b=this,m=new a.Matrix;if(b.removed)return a._.box();for(;"use"==b.type;)if(c||(m=m.add(b.transform().localMatrix.translate(b.attr("x")||
0,b.attr("y")||0))),b.original)b=b.original;else var e=b.attr("xlink:href"),b=b.original=b.node.ownerDocument.getElementById(e.substring(e.indexOf("#")+1));var e=b._,h=a.path.get[b.type]||a.path.get.deflt;try{if(c)return e.bboxwt=h?a.path.getBBox(b.realPath=h(b)):a._.box(b.node.getBBox()),a._.box(e.bboxwt);b.realPath=h(b);b.matrix=b.transform().localMatrix;e.bbox=a.path.getBBox(a.path.map(b.realPath,m.add(b.matrix)));return a._.box(e.bbox)}catch(d){return a._.box()}};var f=function(){return this.string};
c.transform=function(c){var b=this._;if(null==c){var m=this;c=new a.Matrix(this.node.getCTM());for(var e=n(this),h=[e],d=new a.Matrix,l=e.toTransformString(),b=J(e)==J(this.matrix)?J(b.transform):l;"svg"!=m.type&&(m=m.parent());)h.push(n(m));for(m=h.length;m--;)d.add(h[m]);return{string:b,globalMatrix:c,totalMatrix:d,localMatrix:e,diffMatrix:c.clone().add(e.invert()),global:c.toTransformString(),total:d.toTransformString(),local:l,toString:f}}c instanceof a.Matrix?this.matrix=c:n(this,c);this.node&&
("linearGradient"==this.type||"radialGradient"==this.type?v(this.node,{gradientTransform:this.matrix}):"pattern"==this.type?v(this.node,{patternTransform:this.matrix}):v(this.node,{transform:this.matrix}));return this};c.parent=function(){return x(this.node.parentNode)};c.append=c.add=function(c){if(c){if("set"==c.type){var a=this;c.forEach(function(c){a.add(c)});return this}c=x(c);this.node.appendChild(c.node);c.paper=this.paper}return this};c.appendTo=function(c){c&&(c=x(c),c.append(this));return this};
c.prepend=function(c){if(c){if("set"==c.type){var a=this,b;c.forEach(function(c){b?b.after(c):a.prepend(c);b=c});return this}c=x(c);var m=c.parent();this.node.insertBefore(c.node,this.node.firstChild);this.add&&this.add();c.paper=this.paper;this.parent()&&this.parent().add();m&&m.add()}return this};c.prependTo=function(c){c=x(c);c.prepend(this);return this};c.before=function(c){if("set"==c.type){var a=this;c.forEach(function(c){var b=c.parent();a.node.parentNode.insertBefore(c.node,a.node);b&&b.add()});
this.parent().add();return this}c=x(c);var b=c.parent();this.node.parentNode.insertBefore(c.node,this.node);this.parent()&&this.parent().add();b&&b.add();c.paper=this.paper;return this};c.after=function(c){c=x(c);var a=c.parent();this.node.nextSibling?this.node.parentNode.insertBefore(c.node,this.node.nextSibling):this.node.parentNode.appendChild(c.node);this.parent()&&this.parent().add();a&&a.add();c.paper=this.paper;return this};c.insertBefore=function(c){c=x(c);var a=this.parent();c.node.parentNode.insertBefore(this.node,
c.node);this.paper=c.paper;a&&a.add();c.parent()&&c.parent().add();return this};c.insertAfter=function(c){c=x(c);var a=this.parent();c.node.parentNode.insertBefore(this.node,c.node.nextSibling);this.paper=c.paper;a&&a.add();c.parent()&&c.parent().add();return this};c.remove=function(){var c=this.parent();this.node.parentNode&&this.node.parentNode.removeChild(this.node);delete this.paper;this.removed=!0;c&&c.add();return this};c.select=function(c){return x(this.node.querySelector(c))};c.selectAll=
function(c){c=this.node.querySelectorAll(c);for(var b=(a.set||Array)(),m=0;m<c.length;m++)b.push(x(c[m]));return b};c.asPX=function(c,a){null==a&&(a=this.attr(c));return+b(this,c,a)};c.use=function(){var c,a=this.node.id;a||(a=this.id,v(this.node,{id:a}));c="linearGradient"==this.type||"radialGradient"==this.type||"pattern"==this.type?r(this.type,this.node.parentNode):r("use",this.node.parentNode);v(c.node,{"xlink:href":"#"+a});c.original=this;return c};var l=/\S+/g;c.addClass=function(c){var a=(c||
"").match(l)||[];c=this.node;var b=c.className.baseVal,m=b.match(l)||[],e,h,d;if(a.length){for(e=0;d=a[e++];)h=m.indexOf(d),~h||m.push(d);a=m.join(" ");b!=a&&(c.className.baseVal=a)}return this};c.removeClass=function(c){var a=(c||"").match(l)||[];c=this.node;var b=c.className.baseVal,m=b.match(l)||[],e,h;if(m.length){for(e=0;h=a[e++];)h=m.indexOf(h),~h&&m.splice(h,1);a=m.join(" ");b!=a&&(c.className.baseVal=a)}return this};c.hasClass=function(c){return!!~(this.node.className.baseVal.match(l)||[]).indexOf(c)};
c.toggleClass=function(c,a){if(null!=a)return a?this.addClass(c):this.removeClass(c);var b=(c||"").match(l)||[],m=this.node,e=m.className.baseVal,h=e.match(l)||[],d,f,E;for(d=0;E=b[d++];)f=h.indexOf(E),~f?h.splice(f,1):h.push(E);b=h.join(" ");e!=b&&(m.className.baseVal=b);return this};c.clone=function(){var c=x(this.node.cloneNode(!0));v(c.node,"id")&&v(c.node,{id:c.id});m(c);c.insertAfter(this);return c};c.toDefs=function(){u(this).appendChild(this.node);return this};c.pattern=c.toPattern=function(c,
a,b,m){var e=r("pattern",u(this));null==c&&(c=this.getBBox());y(c,"object")&&"x"in c&&(a=c.y,b=c.width,m=c.height,c=c.x);v(e.node,{x:c,y:a,width:b,height:m,patternUnits:"userSpaceOnUse",id:e.id,viewBox:[c,a,b,m].join(" ")});e.node.appendChild(this.node);return e};c.marker=function(c,a,b,m,e,h){var d=r("marker",u(this));null==c&&(c=this.getBBox());y(c,"object")&&"x"in c&&(a=c.y,b=c.width,m=c.height,e=c.refX||c.cx,h=c.refY||c.cy,c=c.x);v(d.node,{viewBox:[c,a,b,m].join(" "),markerWidth:b,markerHeight:m,
orient:"auto",refX:e||0,refY:h||0,id:d.id});d.node.appendChild(this.node);return d};var E=function(c,a,b,m){"function"!=typeof b||b.length||(m=b,b=L.linear);this.attr=c;this.dur=a;b&&(this.easing=b);m&&(this.callback=m)};a._.Animation=E;a.animation=function(c,a,b,m){return new E(c,a,b,m)};c.inAnim=function(){var c=[],a;for(a in this.anims)this.anims[h](a)&&function(a){c.push({anim:new E(a._attrs,a.dur,a.easing,a._callback),mina:a,curStatus:a.status(),status:function(c){return a.status(c)},stop:function(){a.stop()}})}(this.anims[a]);
return c};a.animate=function(c,a,b,m,e,h){"function"!=typeof e||e.length||(h=e,e=L.linear);var d=L.time();c=L(c,a,d,d+m,L.time,b,e);h&&k.once("mina.finish."+c.id,h);return c};c.stop=function(){for(var c=this.inAnim(),a=0,b=c.length;a<b;a++)c[a].stop();return this};c.animate=function(c,a,b,m){"function"!=typeof b||b.length||(m=b,b=L.linear);c instanceof E&&(m=c.callback,b=c.easing,a=b.dur,c=c.attr);var d=[],f=[],l={},t,ca,n,T=this,q;for(q in c)if(c[h](q)){T.equal?(n=T.equal(q,J(c[q])),t=n.from,ca=
n.to,n=n.f):(t=+T.attr(q),ca=+c[q]);var la=y(t,"array")?t.length:1;l[q]=e(d.length,d.length+la,n);d=d.concat(t);f=f.concat(ca)}t=L.time();var p=L(d,f,t,t+a,L.time,function(c){var a={},b;for(b in l)l[h](b)&&(a[b]=l[b](c));T.attr(a)},b);T.anims[p.id]=p;p._attrs=c;p._callback=m;k("snap.animcreated."+T.id,p);k.once("mina.finish."+p.id,function(){delete T.anims[p.id];m&&m.call(T)});k.once("mina.stop."+p.id,function(){delete T.anims[p.id]});return T};var T={};c.data=function(c,b){var m=T[this.id]=T[this.id]||
{};if(0==arguments.length)return k("snap.data.get."+this.id,this,m,null),m;if(1==arguments.length){if(a.is(c,"object")){for(var e in c)c[h](e)&&this.data(e,c[e]);return this}k("snap.data.get."+this.id,this,m[c],c);return m[c]}m[c]=b;k("snap.data.set."+this.id,this,b,c);return this};c.removeData=function(c){null==c?T[this.id]={}:T[this.id]&&delete T[this.id][c];return this};c.outerSVG=c.toString=d(1);c.innerSVG=d()})(e.prototype);a.parse=function(c){var a=G.doc.createDocumentFragment(),b=!0,m=G.doc.createElement("div");
c=J(c);c.match(/^\s*<\s*svg(?:\s|>)/)||(c="<svg>"+c+"</svg>",b=!1);m.innerHTML=c;if(c=m.getElementsByTagName("svg")[0])if(b)a=c;else for(;c.firstChild;)a.appendChild(c.firstChild);m.innerHTML=aa;return new l(a)};l.prototype.select=e.prototype.select;l.prototype.selectAll=e.prototype.selectAll;a.fragment=function(){for(var c=Array.prototype.slice.call(arguments,0),b=G.doc.createDocumentFragment(),m=0,e=c.length;m<e;m++){var h=c[m];h.node&&h.node.nodeType&&b.appendChild(h.node);h.nodeType&&b.appendChild(h);
"string"==typeof h&&b.appendChild(a.parse(h).node)}return new l(b)};a._.make=r;a._.wrap=x;s.prototype.el=function(c,a){var b=r(c,this.node);a&&b.attr(a);return b};k.on("snap.util.getattr",function(){var c=k.nt(),c=c.substring(c.lastIndexOf(".")+1),a=c.replace(/[A-Z]/g,function(c){return"-"+c.toLowerCase()});return pa[h](a)?this.node.ownerDocument.defaultView.getComputedStyle(this.node,null).getPropertyValue(a):v(this.node,c)});var pa={"alignment-baseline":0,"baseline-shift":0,clip:0,"clip-path":0,
"clip-rule":0,color:0,"color-interpolation":0,"color-interpolation-filters":0,"color-profile":0,"color-rendering":0,cursor:0,direction:0,display:0,"dominant-baseline":0,"enable-background":0,fill:0,"fill-opacity":0,"fill-rule":0,filter:0,"flood-color":0,"flood-opacity":0,font:0,"font-family":0,"font-size":0,"font-size-adjust":0,"font-stretch":0,"font-style":0,"font-variant":0,"font-weight":0,"glyph-orientation-horizontal":0,"glyph-orientation-vertical":0,"image-rendering":0,kerning:0,"letter-spacing":0,
"lighting-color":0,marker:0,"marker-end":0,"marker-mid":0,"marker-start":0,mask:0,opacity:0,overflow:0,"pointer-events":0,"shape-rendering":0,"stop-color":0,"stop-opacity":0,stroke:0,"stroke-dasharray":0,"stroke-dashoffset":0,"stroke-linecap":0,"stroke-linejoin":0,"stroke-miterlimit":0,"stroke-opacity":0,"stroke-width":0,"text-anchor":0,"text-decoration":0,"text-rendering":0,"unicode-bidi":0,visibility:0,"word-spacing":0,"writing-mode":0};k.on("snap.util.attr",function(c){var a=k.nt(),b={},a=a.substring(a.lastIndexOf(".")+
1);b[a]=c;var m=a.replace(/-(\w)/gi,function(c,a){return a.toUpperCase()}),a=a.replace(/[A-Z]/g,function(c){return"-"+c.toLowerCase()});pa[h](a)?this.node.style[m]=null==c?aa:c:v(this.node,b)});a.ajax=function(c,a,b,m){var e=new XMLHttpRequest,h=V();if(e){if(y(a,"function"))m=b,b=a,a=null;else if(y(a,"object")){var d=[],f;for(f in a)a.hasOwnProperty(f)&&d.push(encodeURIComponent(f)+"="+encodeURIComponent(a[f]));a=d.join("&")}e.open(a?"POST":"GET",c,!0);a&&(e.setRequestHeader("X-Requested-With","XMLHttpRequest"),
e.setRequestHeader("Content-type","application/x-www-form-urlencoded"));b&&(k.once("snap.ajax."+h+".0",b),k.once("snap.ajax."+h+".200",b),k.once("snap.ajax."+h+".304",b));e.onreadystatechange=function(){4==e.readyState&&k("snap.ajax."+h+"."+e.status,m,e)};if(4==e.readyState)return e;e.send(a);return e}};a.load=function(c,b,m){a.ajax(c,function(c){c=a.parse(c.responseText);m?b.call(m,c):b(c)})};a.getElementByPoint=function(c,a){var b,m,e=G.doc.elementFromPoint(c,a);if(G.win.opera&&"svg"==e.tagName){b=
e;m=b.getBoundingClientRect();b=b.ownerDocument;var h=b.body,d=b.documentElement;b=m.top+(g.win.pageYOffset||d.scrollTop||h.scrollTop)-(d.clientTop||h.clientTop||0);m=m.left+(g.win.pageXOffset||d.scrollLeft||h.scrollLeft)-(d.clientLeft||h.clientLeft||0);h=e.createSVGRect();h.x=c-m;h.y=a-b;h.width=h.height=1;b=e.getIntersectionList(h,null);b.length&&(e=b[b.length-1])}return e?x(e):null};a.plugin=function(c){c(a,e,s,G,l)};return G.win.Snap=a}();C.plugin(function(a,k,y,M,A){function w(a,d,f,b,q,e){null==
d&&"[object SVGMatrix]"==z.call(a)?(this.a=a.a,this.b=a.b,this.c=a.c,this.d=a.d,this.e=a.e,this.f=a.f):null!=a?(this.a=+a,this.b=+d,this.c=+f,this.d=+b,this.e=+q,this.f=+e):(this.a=1,this.c=this.b=0,this.d=1,this.f=this.e=0)}var z=Object.prototype.toString,d=String,f=Math;(function(n){function k(a){return a[0]*a[0]+a[1]*a[1]}function p(a){var d=f.sqrt(k(a));a[0]&&(a[0]/=d);a[1]&&(a[1]/=d)}n.add=function(a,d,e,f,n,p){var k=[[],[],[] ],u=[[this.a,this.c,this.e],[this.b,this.d,this.f],[0,0,1] ];d=[[a,
e,n],[d,f,p],[0,0,1] ];a&&a instanceof w&&(d=[[a.a,a.c,a.e],[a.b,a.d,a.f],[0,0,1] ]);for(a=0;3>a;a++)for(e=0;3>e;e++){for(f=n=0;3>f;f++)n+=u[a][f]*d[f][e];k[a][e]=n}this.a=k[0][0];this.b=k[1][0];this.c=k[0][1];this.d=k[1][1];this.e=k[0][2];this.f=k[1][2];return this};n.invert=function(){var a=this.a*this.d-this.b*this.c;return new w(this.d/a,-this.b/a,-this.c/a,this.a/a,(this.c*this.f-this.d*this.e)/a,(this.b*this.e-this.a*this.f)/a)};n.clone=function(){return new w(this.a,this.b,this.c,this.d,this.e,
this.f)};n.translate=function(a,d){return this.add(1,0,0,1,a,d)};n.scale=function(a,d,e,f){null==d&&(d=a);(e||f)&&this.add(1,0,0,1,e,f);this.add(a,0,0,d,0,0);(e||f)&&this.add(1,0,0,1,-e,-f);return this};n.rotate=function(b,d,e){b=a.rad(b);d=d||0;e=e||0;var l=+f.cos(b).toFixed(9);b=+f.sin(b).toFixed(9);this.add(l,b,-b,l,d,e);return this.add(1,0,0,1,-d,-e)};n.x=function(a,d){return a*this.a+d*this.c+this.e};n.y=function(a,d){return a*this.b+d*this.d+this.f};n.get=function(a){return+this[d.fromCharCode(97+
a)].toFixed(4)};n.toString=function(){return"matrix("+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)].join()+")"};n.offset=function(){return[this.e.toFixed(4),this.f.toFixed(4)]};n.determinant=function(){return this.a*this.d-this.b*this.c};n.split=function(){var b={};b.dx=this.e;b.dy=this.f;var d=[[this.a,this.c],[this.b,this.d] ];b.scalex=f.sqrt(k(d[0]));p(d[0]);b.shear=d[0][0]*d[1][0]+d[0][1]*d[1][1];d[1]=[d[1][0]-d[0][0]*b.shear,d[1][1]-d[0][1]*b.shear];b.scaley=f.sqrt(k(d[1]));
p(d[1]);b.shear/=b.scaley;0>this.determinant()&&(b.scalex=-b.scalex);var e=-d[0][1],d=d[1][1];0>d?(b.rotate=a.deg(f.acos(d)),0>e&&(b.rotate=360-b.rotate)):b.rotate=a.deg(f.asin(e));b.isSimple=!+b.shear.toFixed(9)&&(b.scalex.toFixed(9)==b.scaley.toFixed(9)||!b.rotate);b.isSuperSimple=!+b.shear.toFixed(9)&&b.scalex.toFixed(9)==b.scaley.toFixed(9)&&!b.rotate;b.noRotation=!+b.shear.toFixed(9)&&!b.rotate;return b};n.toTransformString=function(a){a=a||this.split();if(+a.shear.toFixed(9))return"m"+[this.get(0),
this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)];a.scalex=+a.scalex.toFixed(4);a.scaley=+a.scaley.toFixed(4);a.rotate=+a.rotate.toFixed(4);return(a.dx||a.dy?"t"+[+a.dx.toFixed(4),+a.dy.toFixed(4)]:"")+(1!=a.scalex||1!=a.scaley?"s"+[a.scalex,a.scaley,0,0]:"")+(a.rotate?"r"+[+a.rotate.toFixed(4),0,0]:"")}})(w.prototype);a.Matrix=w;a.matrix=function(a,d,f,b,k,e){return new w(a,d,f,b,k,e)}});C.plugin(function(a,v,y,M,A){function w(h){return function(d){k.stop();d instanceof A&&1==d.node.childNodes.length&&
("radialGradient"==d.node.firstChild.tagName||"linearGradient"==d.node.firstChild.tagName||"pattern"==d.node.firstChild.tagName)&&(d=d.node.firstChild,b(this).appendChild(d),d=u(d));if(d instanceof v)if("radialGradient"==d.type||"linearGradient"==d.type||"pattern"==d.type){d.node.id||e(d.node,{id:d.id});var f=l(d.node.id)}else f=d.attr(h);else f=a.color(d),f.error?(f=a(b(this).ownerSVGElement).gradient(d))?(f.node.id||e(f.node,{id:f.id}),f=l(f.node.id)):f=d:f=r(f);d={};d[h]=f;e(this.node,d);this.node.style[h]=
x}}function z(a){k.stop();a==+a&&(a+="px");this.node.style.fontSize=a}function d(a){var b=[];a=a.childNodes;for(var e=0,f=a.length;e<f;e++){var l=a[e];3==l.nodeType&&b.push(l.nodeValue);"tspan"==l.tagName&&(1==l.childNodes.length&&3==l.firstChild.nodeType?b.push(l.firstChild.nodeValue):b.push(d(l)))}return b}function f(){k.stop();return this.node.style.fontSize}var n=a._.make,u=a._.wrap,p=a.is,b=a._.getSomeDefs,q=/^url\(#?([^)]+)\)$/,e=a._.$,l=a.url,r=String,s=a._.separator,x="";k.on("snap.util.attr.mask",
function(a){if(a instanceof v||a instanceof A){k.stop();a instanceof A&&1==a.node.childNodes.length&&(a=a.node.firstChild,b(this).appendChild(a),a=u(a));if("mask"==a.type)var d=a;else d=n("mask",b(this)),d.node.appendChild(a.node);!d.node.id&&e(d.node,{id:d.id});e(this.node,{mask:l(d.id)})}});(function(a){k.on("snap.util.attr.clip",a);k.on("snap.util.attr.clip-path",a);k.on("snap.util.attr.clipPath",a)})(function(a){if(a instanceof v||a instanceof A){k.stop();if("clipPath"==a.type)var d=a;else d=
n("clipPath",b(this)),d.node.appendChild(a.node),!d.node.id&&e(d.node,{id:d.id});e(this.node,{"clip-path":l(d.id)})}});k.on("snap.util.attr.fill",w("fill"));k.on("snap.util.attr.stroke",w("stroke"));var G=/^([lr])(?:\(([^)]*)\))?(.*)$/i;k.on("snap.util.grad.parse",function(a){a=r(a);var b=a.match(G);if(!b)return null;a=b[1];var e=b[2],b=b[3],e=e.split(/\s*,\s*/).map(function(a){return+a==a?+a:a});1==e.length&&0==e[0]&&(e=[]);b=b.split("-");b=b.map(function(a){a=a.split(":");var b={color:a[0]};a[1]&&
(b.offset=parseFloat(a[1]));return b});return{type:a,params:e,stops:b}});k.on("snap.util.attr.d",function(b){k.stop();p(b,"array")&&p(b[0],"array")&&(b=a.path.toString.call(b));b=r(b);b.match(/[ruo]/i)&&(b=a.path.toAbsolute(b));e(this.node,{d:b})})(-1);k.on("snap.util.attr.#text",function(a){k.stop();a=r(a);for(a=M.doc.createTextNode(a);this.node.firstChild;)this.node.removeChild(this.node.firstChild);this.node.appendChild(a)})(-1);k.on("snap.util.attr.path",function(a){k.stop();this.attr({d:a})})(-1);
k.on("snap.util.attr.class",function(a){k.stop();this.node.className.baseVal=a})(-1);k.on("snap.util.attr.viewBox",function(a){a=p(a,"object")&&"x"in a?[a.x,a.y,a.width,a.height].join(" "):p(a,"array")?a.join(" "):a;e(this.node,{viewBox:a});k.stop()})(-1);k.on("snap.util.attr.transform",function(a){this.transform(a);k.stop()})(-1);k.on("snap.util.attr.r",function(a){"rect"==this.type&&(k.stop(),e(this.node,{rx:a,ry:a}))})(-1);k.on("snap.util.attr.textpath",function(a){k.stop();if("text"==this.type){var d,
f;if(!a&&this.textPath){for(a=this.textPath;a.node.firstChild;)this.node.appendChild(a.node.firstChild);a.remove();delete this.textPath}else if(p(a,"string")?(d=b(this),a=u(d.parentNode).path(a),d.appendChild(a.node),d=a.id,a.attr({id:d})):(a=u(a),a instanceof v&&(d=a.attr("id"),d||(d=a.id,a.attr({id:d})))),d)if(a=this.textPath,f=this.node,a)a.attr({"xlink:href":"#"+d});else{for(a=e("textPath",{"xlink:href":"#"+d});f.firstChild;)a.appendChild(f.firstChild);f.appendChild(a);this.textPath=u(a)}}})(-1);
k.on("snap.util.attr.text",function(a){if("text"==this.type){for(var b=this.node,d=function(a){var b=e("tspan");if(p(a,"array"))for(var f=0;f<a.length;f++)b.appendChild(d(a[f]));else b.appendChild(M.doc.createTextNode(a));b.normalize&&b.normalize();return b};b.firstChild;)b.removeChild(b.firstChild);for(a=d(a);a.firstChild;)b.appendChild(a.firstChild)}k.stop()})(-1);k.on("snap.util.attr.fontSize",z)(-1);k.on("snap.util.attr.font-size",z)(-1);k.on("snap.util.getattr.transform",function(){k.stop();
return this.transform()})(-1);k.on("snap.util.getattr.textpath",function(){k.stop();return this.textPath})(-1);(function(){function b(d){return function(){k.stop();var b=M.doc.defaultView.getComputedStyle(this.node,null).getPropertyValue("marker-"+d);return"none"==b?b:a(M.doc.getElementById(b.match(q)[1]))}}function d(a){return function(b){k.stop();var d="marker"+a.charAt(0).toUpperCase()+a.substring(1);if(""==b||!b)this.node.style[d]="none";else if("marker"==b.type){var f=b.node.id;f||e(b.node,{id:b.id});
this.node.style[d]=l(f)}}}k.on("snap.util.getattr.marker-end",b("end"))(-1);k.on("snap.util.getattr.markerEnd",b("end"))(-1);k.on("snap.util.getattr.marker-start",b("start"))(-1);k.on("snap.util.getattr.markerStart",b("start"))(-1);k.on("snap.util.getattr.marker-mid",b("mid"))(-1);k.on("snap.util.getattr.markerMid",b("mid"))(-1);k.on("snap.util.attr.marker-end",d("end"))(-1);k.on("snap.util.attr.markerEnd",d("end"))(-1);k.on("snap.util.attr.marker-start",d("start"))(-1);k.on("snap.util.attr.markerStart",
d("start"))(-1);k.on("snap.util.attr.marker-mid",d("mid"))(-1);k.on("snap.util.attr.markerMid",d("mid"))(-1)})();k.on("snap.util.getattr.r",function(){if("rect"==this.type&&e(this.node,"rx")==e(this.node,"ry"))return k.stop(),e(this.node,"rx")})(-1);k.on("snap.util.getattr.text",function(){if("text"==this.type||"tspan"==this.type){k.stop();var a=d(this.node);return 1==a.length?a[0]:a}})(-1);k.on("snap.util.getattr.#text",function(){return this.node.textContent})(-1);k.on("snap.util.getattr.viewBox",
function(){k.stop();var b=e(this.node,"viewBox");if(b)return b=b.split(s),a._.box(+b[0],+b[1],+b[2],+b[3])})(-1);k.on("snap.util.getattr.points",function(){var a=e(this.node,"points");k.stop();if(a)return a.split(s)})(-1);k.on("snap.util.getattr.path",function(){var a=e(this.node,"d");k.stop();return a})(-1);k.on("snap.util.getattr.class",function(){return this.node.className.baseVal})(-1);k.on("snap.util.getattr.fontSize",f)(-1);k.on("snap.util.getattr.font-size",f)(-1)});C.plugin(function(a,v,y,
M,A){function w(a){return a}function z(a){return function(b){return+b.toFixed(3)+a}}var d={"+":function(a,b){return a+b},"-":function(a,b){return a-b},"/":function(a,b){return a/b},"*":function(a,b){return a*b}},f=String,n=/[a-z]+$/i,u=/^\s*([+\-\/*])\s*=\s*([\d.eE+\-]+)\s*([^\d\s]+)?\s*$/;k.on("snap.util.attr",function(a){if(a=f(a).match(u)){var b=k.nt(),b=b.substring(b.lastIndexOf(".")+1),q=this.attr(b),e={};k.stop();var l=a[3]||"",r=q.match(n),s=d[a[1] ];r&&r==l?a=s(parseFloat(q),+a[2]):(q=this.asPX(b),
a=s(this.asPX(b),this.asPX(b,a[2]+l)));isNaN(q)||isNaN(a)||(e[b]=a,this.attr(e))}})(-10);k.on("snap.util.equal",function(a,b){var q=f(this.attr(a)||""),e=f(b).match(u);if(e){k.stop();var l=e[3]||"",r=q.match(n),s=d[e[1] ];if(r&&r==l)return{from:parseFloat(q),to:s(parseFloat(q),+e[2]),f:z(r)};q=this.asPX(a);return{from:q,to:s(q,this.asPX(a,e[2]+l)),f:w}}})(-10)});C.plugin(function(a,v,y,M,A){var w=y.prototype,z=a.is;w.rect=function(a,d,k,p,b,q){var e;null==q&&(q=b);z(a,"object")&&"[object Object]"==
a?e=a:null!=a&&(e={x:a,y:d,width:k,height:p},null!=b&&(e.rx=b,e.ry=q));return this.el("rect",e)};w.circle=function(a,d,k){var p;z(a,"object")&&"[object Object]"==a?p=a:null!=a&&(p={cx:a,cy:d,r:k});return this.el("circle",p)};var d=function(){function a(){this.parentNode.removeChild(this)}return function(d,k){var p=M.doc.createElement("img"),b=M.doc.body;p.style.cssText="position:absolute;left:-9999em;top:-9999em";p.onload=function(){k.call(p);p.onload=p.onerror=null;b.removeChild(p)};p.onerror=a;
b.appendChild(p);p.src=d}}();w.image=function(f,n,k,p,b){var q=this.el("image");if(z(f,"object")&&"src"in f)q.attr(f);else if(null!=f){var e={"xlink:href":f,preserveAspectRatio:"none"};null!=n&&null!=k&&(e.x=n,e.y=k);null!=p&&null!=b?(e.width=p,e.height=b):d(f,function(){a._.$(q.node,{width:this.offsetWidth,height:this.offsetHeight})});a._.$(q.node,e)}return q};w.ellipse=function(a,d,k,p){var b;z(a,"object")&&"[object Object]"==a?b=a:null!=a&&(b={cx:a,cy:d,rx:k,ry:p});return this.el("ellipse",b)};
w.path=function(a){var d;z(a,"object")&&!z(a,"array")?d=a:a&&(d={d:a});return this.el("path",d)};w.group=w.g=function(a){var d=this.el("g");1==arguments.length&&a&&!a.type?d.attr(a):arguments.length&&d.add(Array.prototype.slice.call(arguments,0));return d};w.svg=function(a,d,k,p,b,q,e,l){var r={};z(a,"object")&&null==d?r=a:(null!=a&&(r.x=a),null!=d&&(r.y=d),null!=k&&(r.width=k),null!=p&&(r.height=p),null!=b&&null!=q&&null!=e&&null!=l&&(r.viewBox=[b,q,e,l]));return this.el("svg",r)};w.mask=function(a){var d=
this.el("mask");1==arguments.length&&a&&!a.type?d.attr(a):arguments.length&&d.add(Array.prototype.slice.call(arguments,0));return d};w.ptrn=function(a,d,k,p,b,q,e,l){if(z(a,"object"))var r=a;else arguments.length?(r={},null!=a&&(r.x=a),null!=d&&(r.y=d),null!=k&&(r.width=k),null!=p&&(r.height=p),null!=b&&null!=q&&null!=e&&null!=l&&(r.viewBox=[b,q,e,l])):r={patternUnits:"userSpaceOnUse"};return this.el("pattern",r)};w.use=function(a){return null!=a?(make("use",this.node),a instanceof v&&(a.attr("id")||
a.attr({id:ID()}),a=a.attr("id")),this.el("use",{"xlink:href":a})):v.prototype.use.call(this)};w.text=function(a,d,k){var p={};z(a,"object")?p=a:null!=a&&(p={x:a,y:d,text:k||""});return this.el("text",p)};w.line=function(a,d,k,p){var b={};z(a,"object")?b=a:null!=a&&(b={x1:a,x2:k,y1:d,y2:p});return this.el("line",b)};w.polyline=function(a){1<arguments.length&&(a=Array.prototype.slice.call(arguments,0));var d={};z(a,"object")&&!z(a,"array")?d=a:null!=a&&(d={points:a});return this.el("polyline",d)};
w.polygon=function(a){1<arguments.length&&(a=Array.prototype.slice.call(arguments,0));var d={};z(a,"object")&&!z(a,"array")?d=a:null!=a&&(d={points:a});return this.el("polygon",d)};(function(){function d(){return this.selectAll("stop")}function n(b,d){var f=e("stop"),k={offset:+d+"%"};b=a.color(b);k["stop-color"]=b.hex;1>b.opacity&&(k["stop-opacity"]=b.opacity);e(f,k);this.node.appendChild(f);return this}function u(){if("linearGradient"==this.type){var b=e(this.node,"x1")||0,d=e(this.node,"x2")||
1,f=e(this.node,"y1")||0,k=e(this.node,"y2")||0;return a._.box(b,f,math.abs(d-b),math.abs(k-f))}b=this.node.r||0;return a._.box((this.node.cx||0.5)-b,(this.node.cy||0.5)-b,2*b,2*b)}function p(a,d){function f(a,b){for(var d=(b-u)/(a-w),e=w;e<a;e++)h[e].offset=+(+u+d*(e-w)).toFixed(2);w=a;u=b}var n=k("snap.util.grad.parse",null,d).firstDefined(),p;if(!n)return null;n.params.unshift(a);p="l"==n.type.toLowerCase()?b.apply(0,n.params):q.apply(0,n.params);n.type!=n.type.toLowerCase()&&e(p.node,{gradientUnits:"userSpaceOnUse"});
var h=n.stops,n=h.length,u=0,w=0;n--;for(var v=0;v<n;v++)"offset"in h[v]&&f(v,h[v].offset);h[n].offset=h[n].offset||100;f(n,h[n].offset);for(v=0;v<=n;v++){var y=h[v];p.addStop(y.color,y.offset)}return p}function b(b,k,p,q,w){b=a._.make("linearGradient",b);b.stops=d;b.addStop=n;b.getBBox=u;null!=k&&e(b.node,{x1:k,y1:p,x2:q,y2:w});return b}function q(b,k,p,q,w,h){b=a._.make("radialGradient",b);b.stops=d;b.addStop=n;b.getBBox=u;null!=k&&e(b.node,{cx:k,cy:p,r:q});null!=w&&null!=h&&e(b.node,{fx:w,fy:h});
return b}var e=a._.$;w.gradient=function(a){return p(this.defs,a)};w.gradientLinear=function(a,d,e,f){return b(this.defs,a,d,e,f)};w.gradientRadial=function(a,b,d,e,f){return q(this.defs,a,b,d,e,f)};w.toString=function(){var b=this.node.ownerDocument,d=b.createDocumentFragment(),b=b.createElement("div"),e=this.node.cloneNode(!0);d.appendChild(b);b.appendChild(e);a._.$(e,{xmlns:"http://www.w3.org/2000/svg"});b=b.innerHTML;d.removeChild(d.firstChild);return b};w.clear=function(){for(var a=this.node.firstChild,
b;a;)b=a.nextSibling,"defs"!=a.tagName?a.parentNode.removeChild(a):w.clear.call({node:a}),a=b}})()});C.plugin(function(a,k,y,M){function A(a){var b=A.ps=A.ps||{};b[a]?b[a].sleep=100:b[a]={sleep:100};setTimeout(function(){for(var d in b)b[L](d)&&d!=a&&(b[d].sleep--,!b[d].sleep&&delete b[d])});return b[a]}function w(a,b,d,e){null==a&&(a=b=d=e=0);null==b&&(b=a.y,d=a.width,e=a.height,a=a.x);return{x:a,y:b,width:d,w:d,height:e,h:e,x2:a+d,y2:b+e,cx:a+d/2,cy:b+e/2,r1:F.min(d,e)/2,r2:F.max(d,e)/2,r0:F.sqrt(d*
d+e*e)/2,path:s(a,b,d,e),vb:[a,b,d,e].join(" ")}}function z(){return this.join(",").replace(N,"$1")}function d(a){a=C(a);a.toString=z;return a}function f(a,b,d,h,f,k,l,n,p){if(null==p)return e(a,b,d,h,f,k,l,n);if(0>p||e(a,b,d,h,f,k,l,n)<p)p=void 0;else{var q=0.5,O=1-q,s;for(s=e(a,b,d,h,f,k,l,n,O);0.01<Z(s-p);)q/=2,O+=(s<p?1:-1)*q,s=e(a,b,d,h,f,k,l,n,O);p=O}return u(a,b,d,h,f,k,l,n,p)}function n(b,d){function e(a){return+(+a).toFixed(3)}return a._.cacher(function(a,h,l){a instanceof k&&(a=a.attr("d"));
a=I(a);for(var n,p,D,q,O="",s={},c=0,t=0,r=a.length;t<r;t++){D=a[t];if("M"==D[0])n=+D[1],p=+D[2];else{q=f(n,p,D[1],D[2],D[3],D[4],D[5],D[6]);if(c+q>h){if(d&&!s.start){n=f(n,p,D[1],D[2],D[3],D[4],D[5],D[6],h-c);O+=["C"+e(n.start.x),e(n.start.y),e(n.m.x),e(n.m.y),e(n.x),e(n.y)];if(l)return O;s.start=O;O=["M"+e(n.x),e(n.y)+"C"+e(n.n.x),e(n.n.y),e(n.end.x),e(n.end.y),e(D[5]),e(D[6])].join();c+=q;n=+D[5];p=+D[6];continue}if(!b&&!d)return n=f(n,p,D[1],D[2],D[3],D[4],D[5],D[6],h-c)}c+=q;n=+D[5];p=+D[6]}O+=
D.shift()+D}s.end=O;return n=b?c:d?s:u(n,p,D[0],D[1],D[2],D[3],D[4],D[5],1)},null,a._.clone)}function u(a,b,d,e,h,f,k,l,n){var p=1-n,q=ma(p,3),s=ma(p,2),c=n*n,t=c*n,r=q*a+3*s*n*d+3*p*n*n*h+t*k,q=q*b+3*s*n*e+3*p*n*n*f+t*l,s=a+2*n*(d-a)+c*(h-2*d+a),t=b+2*n*(e-b)+c*(f-2*e+b),x=d+2*n*(h-d)+c*(k-2*h+d),c=e+2*n*(f-e)+c*(l-2*f+e);a=p*a+n*d;b=p*b+n*e;h=p*h+n*k;f=p*f+n*l;l=90-180*F.atan2(s-x,t-c)/S;return{x:r,y:q,m:{x:s,y:t},n:{x:x,y:c},start:{x:a,y:b},end:{x:h,y:f},alpha:l}}function p(b,d,e,h,f,n,k,l){a.is(b,
"array")||(b=[b,d,e,h,f,n,k,l]);b=U.apply(null,b);return w(b.min.x,b.min.y,b.max.x-b.min.x,b.max.y-b.min.y)}function b(a,b,d){return b>=a.x&&b<=a.x+a.width&&d>=a.y&&d<=a.y+a.height}function q(a,d){a=w(a);d=w(d);return b(d,a.x,a.y)||b(d,a.x2,a.y)||b(d,a.x,a.y2)||b(d,a.x2,a.y2)||b(a,d.x,d.y)||b(a,d.x2,d.y)||b(a,d.x,d.y2)||b(a,d.x2,d.y2)||(a.x<d.x2&&a.x>d.x||d.x<a.x2&&d.x>a.x)&&(a.y<d.y2&&a.y>d.y||d.y<a.y2&&d.y>a.y)}function e(a,b,d,e,h,f,n,k,l){null==l&&(l=1);l=(1<l?1:0>l?0:l)/2;for(var p=[-0.1252,
0.1252,-0.3678,0.3678,-0.5873,0.5873,-0.7699,0.7699,-0.9041,0.9041,-0.9816,0.9816],q=[0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],s=0,c=0;12>c;c++)var t=l*p[c]+l,r=t*(t*(-3*a+9*d-9*h+3*n)+6*a-12*d+6*h)-3*a+3*d,t=t*(t*(-3*b+9*e-9*f+3*k)+6*b-12*e+6*f)-3*b+3*e,s=s+q[c]*F.sqrt(r*r+t*t);return l*s}function l(a,b,d){a=I(a);b=I(b);for(var h,f,l,n,k,s,r,O,x,c,t=d?0:[],w=0,v=a.length;w<v;w++)if(x=a[w],"M"==x[0])h=k=x[1],f=s=x[2];else{"C"==x[0]?(x=[h,f].concat(x.slice(1)),
h=x[6],f=x[7]):(x=[h,f,h,f,k,s,k,s],h=k,f=s);for(var G=0,y=b.length;G<y;G++)if(c=b[G],"M"==c[0])l=r=c[1],n=O=c[2];else{"C"==c[0]?(c=[l,n].concat(c.slice(1)),l=c[6],n=c[7]):(c=[l,n,l,n,r,O,r,O],l=r,n=O);var z;var K=x,B=c;z=d;var H=p(K),J=p(B);if(q(H,J)){for(var H=e.apply(0,K),J=e.apply(0,B),H=~~(H/8),J=~~(J/8),U=[],A=[],F={},M=z?0:[],P=0;P<H+1;P++){var C=u.apply(0,K.concat(P/H));U.push({x:C.x,y:C.y,t:P/H})}for(P=0;P<J+1;P++)C=u.apply(0,B.concat(P/J)),A.push({x:C.x,y:C.y,t:P/J});for(P=0;P<H;P++)for(K=
0;K<J;K++){var Q=U[P],L=U[P+1],B=A[K],C=A[K+1],N=0.001>Z(L.x-Q.x)?"y":"x",S=0.001>Z(C.x-B.x)?"y":"x",R;R=Q.x;var Y=Q.y,V=L.x,ea=L.y,fa=B.x,ga=B.y,ha=C.x,ia=C.y;if(W(R,V)<X(fa,ha)||X(R,V)>W(fa,ha)||W(Y,ea)<X(ga,ia)||X(Y,ea)>W(ga,ia))R=void 0;else{var $=(R*ea-Y*V)*(fa-ha)-(R-V)*(fa*ia-ga*ha),aa=(R*ea-Y*V)*(ga-ia)-(Y-ea)*(fa*ia-ga*ha),ja=(R-V)*(ga-ia)-(Y-ea)*(fa-ha);if(ja){var $=$/ja,aa=aa/ja,ja=+$.toFixed(2),ba=+aa.toFixed(2);R=ja<+X(R,V).toFixed(2)||ja>+W(R,V).toFixed(2)||ja<+X(fa,ha).toFixed(2)||
ja>+W(fa,ha).toFixed(2)||ba<+X(Y,ea).toFixed(2)||ba>+W(Y,ea).toFixed(2)||ba<+X(ga,ia).toFixed(2)||ba>+W(ga,ia).toFixed(2)?void 0:{x:$,y:aa}}else R=void 0}R&&F[R.x.toFixed(4)]!=R.y.toFixed(4)&&(F[R.x.toFixed(4)]=R.y.toFixed(4),Q=Q.t+Z((R[N]-Q[N])/(L[N]-Q[N]))*(L.t-Q.t),B=B.t+Z((R[S]-B[S])/(C[S]-B[S]))*(C.t-B.t),0<=Q&&1>=Q&&0<=B&&1>=B&&(z?M++:M.push({x:R.x,y:R.y,t1:Q,t2:B})))}z=M}else z=z?0:[];if(d)t+=z;else{H=0;for(J=z.length;H<J;H++)z[H].segment1=w,z[H].segment2=G,z[H].bez1=x,z[H].bez2=c;t=t.concat(z)}}}return t}
function r(a){var b=A(a);if(b.bbox)return C(b.bbox);if(!a)return w();a=I(a);for(var d=0,e=0,h=[],f=[],l,n=0,k=a.length;n<k;n++)l=a[n],"M"==l[0]?(d=l[1],e=l[2],h.push(d),f.push(e)):(d=U(d,e,l[1],l[2],l[3],l[4],l[5],l[6]),h=h.concat(d.min.x,d.max.x),f=f.concat(d.min.y,d.max.y),d=l[5],e=l[6]);a=X.apply(0,h);l=X.apply(0,f);h=W.apply(0,h);f=W.apply(0,f);f=w(a,l,h-a,f-l);b.bbox=C(f);return f}function s(a,b,d,e,h){if(h)return[["M",+a+ +h,b],["l",d-2*h,0],["a",h,h,0,0,1,h,h],["l",0,e-2*h],["a",h,h,0,0,1,
-h,h],["l",2*h-d,0],["a",h,h,0,0,1,-h,-h],["l",0,2*h-e],["a",h,h,0,0,1,h,-h],["z"] ];a=[["M",a,b],["l",d,0],["l",0,e],["l",-d,0],["z"] ];a.toString=z;return a}function x(a,b,d,e,h){null==h&&null==e&&(e=d);a=+a;b=+b;d=+d;e=+e;if(null!=h){var f=Math.PI/180,l=a+d*Math.cos(-e*f);a+=d*Math.cos(-h*f);var n=b+d*Math.sin(-e*f);b+=d*Math.sin(-h*f);d=[["M",l,n],["A",d,d,0,+(180<h-e),0,a,b] ]}else d=[["M",a,b],["m",0,-e],["a",d,e,0,1,1,0,2*e],["a",d,e,0,1,1,0,-2*e],["z"] ];d.toString=z;return d}function G(b){var e=
A(b);if(e.abs)return d(e.abs);Q(b,"array")&&Q(b&&b[0],"array")||(b=a.parsePathString(b));if(!b||!b.length)return[["M",0,0] ];var h=[],f=0,l=0,n=0,k=0,p=0;"M"==b[0][0]&&(f=+b[0][1],l=+b[0][2],n=f,k=l,p++,h[0]=["M",f,l]);for(var q=3==b.length&&"M"==b[0][0]&&"R"==b[1][0].toUpperCase()&&"Z"==b[2][0].toUpperCase(),s,r,w=p,c=b.length;w<c;w++){h.push(s=[]);r=b[w];p=r[0];if(p!=p.toUpperCase())switch(s[0]=p.toUpperCase(),s[0]){case "A":s[1]=r[1];s[2]=r[2];s[3]=r[3];s[4]=r[4];s[5]=r[5];s[6]=+r[6]+f;s[7]=+r[7]+
l;break;case "V":s[1]=+r[1]+l;break;case "H":s[1]=+r[1]+f;break;case "R":for(var t=[f,l].concat(r.slice(1)),u=2,v=t.length;u<v;u++)t[u]=+t[u]+f,t[++u]=+t[u]+l;h.pop();h=h.concat(P(t,q));break;case "O":h.pop();t=x(f,l,r[1],r[2]);t.push(t[0]);h=h.concat(t);break;case "U":h.pop();h=h.concat(x(f,l,r[1],r[2],r[3]));s=["U"].concat(h[h.length-1].slice(-2));break;case "M":n=+r[1]+f,k=+r[2]+l;default:for(u=1,v=r.length;u<v;u++)s[u]=+r[u]+(u%2?f:l)}else if("R"==p)t=[f,l].concat(r.slice(1)),h.pop(),h=h.concat(P(t,
q)),s=["R"].concat(r.slice(-2));else if("O"==p)h.pop(),t=x(f,l,r[1],r[2]),t.push(t[0]),h=h.concat(t);else if("U"==p)h.pop(),h=h.concat(x(f,l,r[1],r[2],r[3])),s=["U"].concat(h[h.length-1].slice(-2));else for(t=0,u=r.length;t<u;t++)s[t]=r[t];p=p.toUpperCase();if("O"!=p)switch(s[0]){case "Z":f=+n;l=+k;break;case "H":f=s[1];break;case "V":l=s[1];break;case "M":n=s[s.length-2],k=s[s.length-1];default:f=s[s.length-2],l=s[s.length-1]}}h.toString=z;e.abs=d(h);return h}function h(a,b,d,e){return[a,b,d,e,d,
e]}function J(a,b,d,e,h,f){var l=1/3,n=2/3;return[l*a+n*d,l*b+n*e,l*h+n*d,l*f+n*e,h,f]}function K(b,d,e,h,f,l,n,k,p,s){var r=120*S/180,q=S/180*(+f||0),c=[],t,x=a._.cacher(function(a,b,c){var d=a*F.cos(c)-b*F.sin(c);a=a*F.sin(c)+b*F.cos(c);return{x:d,y:a}});if(s)v=s[0],t=s[1],l=s[2],u=s[3];else{t=x(b,d,-q);b=t.x;d=t.y;t=x(k,p,-q);k=t.x;p=t.y;F.cos(S/180*f);F.sin(S/180*f);t=(b-k)/2;v=(d-p)/2;u=t*t/(e*e)+v*v/(h*h);1<u&&(u=F.sqrt(u),e*=u,h*=u);var u=e*e,w=h*h,u=(l==n?-1:1)*F.sqrt(Z((u*w-u*v*v-w*t*t)/
(u*v*v+w*t*t)));l=u*e*v/h+(b+k)/2;var u=u*-h*t/e+(d+p)/2,v=F.asin(((d-u)/h).toFixed(9));t=F.asin(((p-u)/h).toFixed(9));v=b<l?S-v:v;t=k<l?S-t:t;0>v&&(v=2*S+v);0>t&&(t=2*S+t);n&&v>t&&(v-=2*S);!n&&t>v&&(t-=2*S)}if(Z(t-v)>r){var c=t,w=k,G=p;t=v+r*(n&&t>v?1:-1);k=l+e*F.cos(t);p=u+h*F.sin(t);c=K(k,p,e,h,f,0,n,w,G,[t,c,l,u])}l=t-v;f=F.cos(v);r=F.sin(v);n=F.cos(t);t=F.sin(t);l=F.tan(l/4);e=4/3*e*l;l*=4/3*h;h=[b,d];b=[b+e*r,d-l*f];d=[k+e*t,p-l*n];k=[k,p];b[0]=2*h[0]-b[0];b[1]=2*h[1]-b[1];if(s)return[b,d,k].concat(c);
c=[b,d,k].concat(c).join().split(",");s=[];k=0;for(p=c.length;k<p;k++)s[k]=k%2?x(c[k-1],c[k],q).y:x(c[k],c[k+1],q).x;return s}function U(a,b,d,e,h,f,l,k){for(var n=[],p=[[],[] ],s,r,c,t,q=0;2>q;++q)0==q?(r=6*a-12*d+6*h,s=-3*a+9*d-9*h+3*l,c=3*d-3*a):(r=6*b-12*e+6*f,s=-3*b+9*e-9*f+3*k,c=3*e-3*b),1E-12>Z(s)?1E-12>Z(r)||(s=-c/r,0<s&&1>s&&n.push(s)):(t=r*r-4*c*s,c=F.sqrt(t),0>t||(t=(-r+c)/(2*s),0<t&&1>t&&n.push(t),s=(-r-c)/(2*s),0<s&&1>s&&n.push(s)));for(r=q=n.length;q--;)s=n[q],c=1-s,p[0][q]=c*c*c*a+3*
c*c*s*d+3*c*s*s*h+s*s*s*l,p[1][q]=c*c*c*b+3*c*c*s*e+3*c*s*s*f+s*s*s*k;p[0][r]=a;p[1][r]=b;p[0][r+1]=l;p[1][r+1]=k;p[0].length=p[1].length=r+2;return{min:{x:X.apply(0,p[0]),y:X.apply(0,p[1])},max:{x:W.apply(0,p[0]),y:W.apply(0,p[1])}}}function I(a,b){var e=!b&&A(a);if(!b&&e.curve)return d(e.curve);var f=G(a),l=b&&G(b),n={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},k={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},p=function(a,b,c){if(!a)return["C",b.x,b.y,b.x,b.y,b.x,b.y];a[0]in{T:1,Q:1}||(b.qx=b.qy=null);
switch(a[0]){case "M":b.X=a[1];b.Y=a[2];break;case "A":a=["C"].concat(K.apply(0,[b.x,b.y].concat(a.slice(1))));break;case "S":"C"==c||"S"==c?(c=2*b.x-b.bx,b=2*b.y-b.by):(c=b.x,b=b.y);a=["C",c,b].concat(a.slice(1));break;case "T":"Q"==c||"T"==c?(b.qx=2*b.x-b.qx,b.qy=2*b.y-b.qy):(b.qx=b.x,b.qy=b.y);a=["C"].concat(J(b.x,b.y,b.qx,b.qy,a[1],a[2]));break;case "Q":b.qx=a[1];b.qy=a[2];a=["C"].concat(J(b.x,b.y,a[1],a[2],a[3],a[4]));break;case "L":a=["C"].concat(h(b.x,b.y,a[1],a[2]));break;case "H":a=["C"].concat(h(b.x,
b.y,a[1],b.y));break;case "V":a=["C"].concat(h(b.x,b.y,b.x,a[1]));break;case "Z":a=["C"].concat(h(b.x,b.y,b.X,b.Y))}return a},s=function(a,b){if(7<a[b].length){a[b].shift();for(var c=a[b];c.length;)q[b]="A",l&&(u[b]="A"),a.splice(b++,0,["C"].concat(c.splice(0,6)));a.splice(b,1);v=W(f.length,l&&l.length||0)}},r=function(a,b,c,d,e){a&&b&&"M"==a[e][0]&&"M"!=b[e][0]&&(b.splice(e,0,["M",d.x,d.y]),c.bx=0,c.by=0,c.x=a[e][1],c.y=a[e][2],v=W(f.length,l&&l.length||0))},q=[],u=[],c="",t="",x=0,v=W(f.length,
l&&l.length||0);for(;x<v;x++){f[x]&&(c=f[x][0]);"C"!=c&&(q[x]=c,x&&(t=q[x-1]));f[x]=p(f[x],n,t);"A"!=q[x]&&"C"==c&&(q[x]="C");s(f,x);l&&(l[x]&&(c=l[x][0]),"C"!=c&&(u[x]=c,x&&(t=u[x-1])),l[x]=p(l[x],k,t),"A"!=u[x]&&"C"==c&&(u[x]="C"),s(l,x));r(f,l,n,k,x);r(l,f,k,n,x);var w=f[x],z=l&&l[x],y=w.length,U=l&&z.length;n.x=w[y-2];n.y=w[y-1];n.bx=$(w[y-4])||n.x;n.by=$(w[y-3])||n.y;k.bx=l&&($(z[U-4])||k.x);k.by=l&&($(z[U-3])||k.y);k.x=l&&z[U-2];k.y=l&&z[U-1]}l||(e.curve=d(f));return l?[f,l]:f}function P(a,
b){for(var d=[],e=0,h=a.length;h-2*!b>e;e+=2){var f=[{x:+a[e-2],y:+a[e-1]},{x:+a[e],y:+a[e+1]},{x:+a[e+2],y:+a[e+3]},{x:+a[e+4],y:+a[e+5]}];b?e?h-4==e?f[3]={x:+a[0],y:+a[1]}:h-2==e&&(f[2]={x:+a[0],y:+a[1]},f[3]={x:+a[2],y:+a[3]}):f[0]={x:+a[h-2],y:+a[h-1]}:h-4==e?f[3]=f[2]:e||(f[0]={x:+a[e],y:+a[e+1]});d.push(["C",(-f[0].x+6*f[1].x+f[2].x)/6,(-f[0].y+6*f[1].y+f[2].y)/6,(f[1].x+6*f[2].x-f[3].x)/6,(f[1].y+6*f[2].y-f[3].y)/6,f[2].x,f[2].y])}return d}y=k.prototype;var Q=a.is,C=a._.clone,L="hasOwnProperty",
N=/,?([a-z]),?/gi,$=parseFloat,F=Math,S=F.PI,X=F.min,W=F.max,ma=F.pow,Z=F.abs;M=n(1);var na=n(),ba=n(0,1),V=a._unit2px;a.path=A;a.path.getTotalLength=M;a.path.getPointAtLength=na;a.path.getSubpath=function(a,b,d){if(1E-6>this.getTotalLength(a)-d)return ba(a,b).end;a=ba(a,d,1);return b?ba(a,b).end:a};y.getTotalLength=function(){if(this.node.getTotalLength)return this.node.getTotalLength()};y.getPointAtLength=function(a){return na(this.attr("d"),a)};y.getSubpath=function(b,d){return a.path.getSubpath(this.attr("d"),
b,d)};a._.box=w;a.path.findDotsAtSegment=u;a.path.bezierBBox=p;a.path.isPointInsideBBox=b;a.path.isBBoxIntersect=q;a.path.intersection=function(a,b){return l(a,b)};a.path.intersectionNumber=function(a,b){return l(a,b,1)};a.path.isPointInside=function(a,d,e){var h=r(a);return b(h,d,e)&&1==l(a,[["M",d,e],["H",h.x2+10] ],1)%2};a.path.getBBox=r;a.path.get={path:function(a){return a.attr("path")},circle:function(a){a=V(a);return x(a.cx,a.cy,a.r)},ellipse:function(a){a=V(a);return x(a.cx||0,a.cy||0,a.rx,
a.ry)},rect:function(a){a=V(a);return s(a.x||0,a.y||0,a.width,a.height,a.rx,a.ry)},image:function(a){a=V(a);return s(a.x||0,a.y||0,a.width,a.height)},line:function(a){return"M"+[a.attr("x1")||0,a.attr("y1")||0,a.attr("x2"),a.attr("y2")]},polyline:function(a){return"M"+a.attr("points")},polygon:function(a){return"M"+a.attr("points")+"z"},deflt:function(a){a=a.node.getBBox();return s(a.x,a.y,a.width,a.height)}};a.path.toRelative=function(b){var e=A(b),h=String.prototype.toLowerCase;if(e.rel)return d(e.rel);
a.is(b,"array")&&a.is(b&&b[0],"array")||(b=a.parsePathString(b));var f=[],l=0,n=0,k=0,p=0,s=0;"M"==b[0][0]&&(l=b[0][1],n=b[0][2],k=l,p=n,s++,f.push(["M",l,n]));for(var r=b.length;s<r;s++){var q=f[s]=[],x=b[s];if(x[0]!=h.call(x[0]))switch(q[0]=h.call(x[0]),q[0]){case "a":q[1]=x[1];q[2]=x[2];q[3]=x[3];q[4]=x[4];q[5]=x[5];q[6]=+(x[6]-l).toFixed(3);q[7]=+(x[7]-n).toFixed(3);break;case "v":q[1]=+(x[1]-n).toFixed(3);break;case "m":k=x[1],p=x[2];default:for(var c=1,t=x.length;c<t;c++)q[c]=+(x[c]-(c%2?l:
n)).toFixed(3)}else for(f[s]=[],"m"==x[0]&&(k=x[1]+l,p=x[2]+n),q=0,c=x.length;q<c;q++)f[s][q]=x[q];x=f[s].length;switch(f[s][0]){case "z":l=k;n=p;break;case "h":l+=+f[s][x-1];break;case "v":n+=+f[s][x-1];break;default:l+=+f[s][x-2],n+=+f[s][x-1]}}f.toString=z;e.rel=d(f);return f};a.path.toAbsolute=G;a.path.toCubic=I;a.path.map=function(a,b){if(!b)return a;var d,e,h,f,l,n,k;a=I(a);h=0;for(l=a.length;h<l;h++)for(k=a[h],f=1,n=k.length;f<n;f+=2)d=b.x(k[f],k[f+1]),e=b.y(k[f],k[f+1]),k[f]=d,k[f+1]=e;return a};
a.path.toString=z;a.path.clone=d});C.plugin(function(a,v,y,C){var A=Math.max,w=Math.min,z=function(a){this.items=[];this.bindings={};this.length=0;this.type="set";if(a)for(var f=0,n=a.length;f<n;f++)a[f]&&(this[this.items.length]=this.items[this.items.length]=a[f],this.length++)};v=z.prototype;v.push=function(){for(var a,f,n=0,k=arguments.length;n<k;n++)if(a=arguments[n])f=this.items.length,this[f]=this.items[f]=a,this.length++;return this};v.pop=function(){this.length&&delete this[this.length--];
return this.items.pop()};v.forEach=function(a,f){for(var n=0,k=this.items.length;n<k&&!1!==a.call(f,this.items[n],n);n++);return this};v.animate=function(d,f,n,u){"function"!=typeof n||n.length||(u=n,n=L.linear);d instanceof a._.Animation&&(u=d.callback,n=d.easing,f=n.dur,d=d.attr);var p=arguments;if(a.is(d,"array")&&a.is(p[p.length-1],"array"))var b=!0;var q,e=function(){q?this.b=q:q=this.b},l=0,r=u&&function(){l++==this.length&&u.call(this)};return this.forEach(function(a,l){k.once("snap.animcreated."+
a.id,e);b?p[l]&&a.animate.apply(a,p[l]):a.animate(d,f,n,r)})};v.remove=function(){for(;this.length;)this.pop().remove();return this};v.bind=function(a,f,k){var u={};if("function"==typeof f)this.bindings[a]=f;else{var p=k||a;this.bindings[a]=function(a){u[p]=a;f.attr(u)}}return this};v.attr=function(a){var f={},k;for(k in a)if(this.bindings[k])this.bindings[k](a[k]);else f[k]=a[k];a=0;for(k=this.items.length;a<k;a++)this.items[a].attr(f);return this};v.clear=function(){for(;this.length;)this.pop()};
v.splice=function(a,f,k){a=0>a?A(this.length+a,0):a;f=A(0,w(this.length-a,f));var u=[],p=[],b=[],q;for(q=2;q<arguments.length;q++)b.push(arguments[q]);for(q=0;q<f;q++)p.push(this[a+q]);for(;q<this.length-a;q++)u.push(this[a+q]);var e=b.length;for(q=0;q<e+u.length;q++)this.items[a+q]=this[a+q]=q<e?b[q]:u[q-e];for(q=this.items.length=this.length-=f-e;this[q];)delete this[q++];return new z(p)};v.exclude=function(a){for(var f=0,k=this.length;f<k;f++)if(this[f]==a)return this.splice(f,1),!0;return!1};
v.insertAfter=function(a){for(var f=this.items.length;f--;)this.items[f].insertAfter(a);return this};v.getBBox=function(){for(var a=[],f=[],k=[],u=[],p=this.items.length;p--;)if(!this.items[p].removed){var b=this.items[p].getBBox();a.push(b.x);f.push(b.y);k.push(b.x+b.width);u.push(b.y+b.height)}a=w.apply(0,a);f=w.apply(0,f);k=A.apply(0,k);u=A.apply(0,u);return{x:a,y:f,x2:k,y2:u,width:k-a,height:u-f,cx:a+(k-a)/2,cy:f+(u-f)/2}};v.clone=function(a){a=new z;for(var f=0,k=this.items.length;f<k;f++)a.push(this.items[f].clone());
return a};v.toString=function(){return"Snap\u2018s set"};v.type="set";a.set=function(){var a=new z;arguments.length&&a.push.apply(a,Array.prototype.slice.call(arguments,0));return a}});C.plugin(function(a,v,y,C){function A(a){var b=a[0];switch(b.toLowerCase()){case "t":return[b,0,0];case "m":return[b,1,0,0,1,0,0];case "r":return 4==a.length?[b,0,a[2],a[3] ]:[b,0];case "s":return 5==a.length?[b,1,1,a[3],a[4] ]:3==a.length?[b,1,1]:[b,1]}}function w(b,d,f){d=q(d).replace(/\.{3}|\u2026/g,b);b=a.parseTransformString(b)||
[];d=a.parseTransformString(d)||[];for(var k=Math.max(b.length,d.length),p=[],v=[],h=0,w,z,y,I;h<k;h++){y=b[h]||A(d[h]);I=d[h]||A(y);if(y[0]!=I[0]||"r"==y[0].toLowerCase()&&(y[2]!=I[2]||y[3]!=I[3])||"s"==y[0].toLowerCase()&&(y[3]!=I[3]||y[4]!=I[4])){b=a._.transform2matrix(b,f());d=a._.transform2matrix(d,f());p=[["m",b.a,b.b,b.c,b.d,b.e,b.f] ];v=[["m",d.a,d.b,d.c,d.d,d.e,d.f] ];break}p[h]=[];v[h]=[];w=0;for(z=Math.max(y.length,I.length);w<z;w++)w in y&&(p[h][w]=y[w]),w in I&&(v[h][w]=I[w])}return{from:u(p),
to:u(v),f:n(p)}}function z(a){return a}function d(a){return function(b){return+b.toFixed(3)+a}}function f(b){return a.rgb(b[0],b[1],b[2])}function n(a){var b=0,d,f,k,n,h,p,q=[];d=0;for(f=a.length;d<f;d++){h="[";p=['"'+a[d][0]+'"'];k=1;for(n=a[d].length;k<n;k++)p[k]="val["+b++ +"]";h+=p+"]";q[d]=h}return Function("val","return Snap.path.toString.call(["+q+"])")}function u(a){for(var b=[],d=0,f=a.length;d<f;d++)for(var k=1,n=a[d].length;k<n;k++)b.push(a[d][k]);return b}var p={},b=/[a-z]+$/i,q=String;
p.stroke=p.fill="colour";v.prototype.equal=function(a,b){return k("snap.util.equal",this,a,b).firstDefined()};k.on("snap.util.equal",function(e,k){var r,s;r=q(this.attr(e)||"");var x=this;if(r==+r&&k==+k)return{from:+r,to:+k,f:z};if("colour"==p[e])return r=a.color(r),s=a.color(k),{from:[r.r,r.g,r.b,r.opacity],to:[s.r,s.g,s.b,s.opacity],f:f};if("transform"==e||"gradientTransform"==e||"patternTransform"==e)return k instanceof a.Matrix&&(k=k.toTransformString()),a._.rgTransform.test(k)||(k=a._.svgTransform2string(k)),
w(r,k,function(){return x.getBBox(1)});if("d"==e||"path"==e)return r=a.path.toCubic(r,k),{from:u(r[0]),to:u(r[1]),f:n(r[0])};if("points"==e)return r=q(r).split(a._.separator),s=q(k).split(a._.separator),{from:r,to:s,f:function(a){return a}};aUnit=r.match(b);s=q(k).match(b);return aUnit&&aUnit==s?{from:parseFloat(r),to:parseFloat(k),f:d(aUnit)}:{from:this.asPX(e),to:this.asPX(e,k),f:z}})});C.plugin(function(a,v,y,C){var A=v.prototype,w="createTouch"in C.doc;v="click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel".split(" ");
var z={mousedown:"touchstart",mousemove:"touchmove",mouseup:"touchend"},d=function(a,b){var d="y"==a?"scrollTop":"scrollLeft",e=b&&b.node?b.node.ownerDocument:C.doc;return e[d in e.documentElement?"documentElement":"body"][d]},f=function(){this.returnValue=!1},n=function(){return this.originalEvent.preventDefault()},u=function(){this.cancelBubble=!0},p=function(){return this.originalEvent.stopPropagation()},b=function(){if(C.doc.addEventListener)return function(a,b,e,f){var k=w&&z[b]?z[b]:b,l=function(k){var l=
d("y",f),q=d("x",f);if(w&&z.hasOwnProperty(b))for(var r=0,u=k.targetTouches&&k.targetTouches.length;r<u;r++)if(k.targetTouches[r].target==a||a.contains(k.targetTouches[r].target)){u=k;k=k.targetTouches[r];k.originalEvent=u;k.preventDefault=n;k.stopPropagation=p;break}return e.call(f,k,k.clientX+q,k.clientY+l)};b!==k&&a.addEventListener(b,l,!1);a.addEventListener(k,l,!1);return function(){b!==k&&a.removeEventListener(b,l,!1);a.removeEventListener(k,l,!1);return!0}};if(C.doc.attachEvent)return function(a,
b,e,h){var k=function(a){a=a||h.node.ownerDocument.window.event;var b=d("y",h),k=d("x",h),k=a.clientX+k,b=a.clientY+b;a.preventDefault=a.preventDefault||f;a.stopPropagation=a.stopPropagation||u;return e.call(h,a,k,b)};a.attachEvent("on"+b,k);return function(){a.detachEvent("on"+b,k);return!0}}}(),q=[],e=function(a){for(var b=a.clientX,e=a.clientY,f=d("y"),l=d("x"),n,p=q.length;p--;){n=q[p];if(w)for(var r=a.touches&&a.touches.length,u;r--;){if(u=a.touches[r],u.identifier==n.el._drag.id||n.el.node.contains(u.target)){b=
u.clientX;e=u.clientY;(a.originalEvent?a.originalEvent:a).preventDefault();break}}else a.preventDefault();b+=l;e+=f;k("snap.drag.move."+n.el.id,n.move_scope||n.el,b-n.el._drag.x,e-n.el._drag.y,b,e,a)}},l=function(b){a.unmousemove(e).unmouseup(l);for(var d=q.length,f;d--;)f=q[d],f.el._drag={},k("snap.drag.end."+f.el.id,f.end_scope||f.start_scope||f.move_scope||f.el,b);q=[]};for(y=v.length;y--;)(function(d){a[d]=A[d]=function(e,f){a.is(e,"function")&&(this.events=this.events||[],this.events.push({name:d,
f:e,unbind:b(this.node||document,d,e,f||this)}));return this};a["un"+d]=A["un"+d]=function(a){for(var b=this.events||[],e=b.length;e--;)if(b[e].name==d&&(b[e].f==a||!a)){b[e].unbind();b.splice(e,1);!b.length&&delete this.events;break}return this}})(v[y]);A.hover=function(a,b,d,e){return this.mouseover(a,d).mouseout(b,e||d)};A.unhover=function(a,b){return this.unmouseover(a).unmouseout(b)};var r=[];A.drag=function(b,d,f,h,n,p){function u(r,v,w){(r.originalEvent||r).preventDefault();this._drag.x=v;
this._drag.y=w;this._drag.id=r.identifier;!q.length&&a.mousemove(e).mouseup(l);q.push({el:this,move_scope:h,start_scope:n,end_scope:p});d&&k.on("snap.drag.start."+this.id,d);b&&k.on("snap.drag.move."+this.id,b);f&&k.on("snap.drag.end."+this.id,f);k("snap.drag.start."+this.id,n||h||this,v,w,r)}if(!arguments.length){var v;return this.drag(function(a,b){this.attr({transform:v+(v?"T":"t")+[a,b]})},function(){v=this.transform().local})}this._drag={};r.push({el:this,start:u});this.mousedown(u);return this};
A.undrag=function(){for(var b=r.length;b--;)r[b].el==this&&(this.unmousedown(r[b].start),r.splice(b,1),k.unbind("snap.drag.*."+this.id));!r.length&&a.unmousemove(e).unmouseup(l);return this}});C.plugin(function(a,v,y,C){y=y.prototype;var A=/^\s*url\((.+)\)/,w=String,z=a._.$;a.filter={};y.filter=function(d){var f=this;"svg"!=f.type&&(f=f.paper);d=a.parse(w(d));var k=a._.id(),u=z("filter");z(u,{id:k,filterUnits:"userSpaceOnUse"});u.appendChild(d.node);f.defs.appendChild(u);return new v(u)};k.on("snap.util.getattr.filter",
function(){k.stop();var d=z(this.node,"filter");if(d)return(d=w(d).match(A))&&a.select(d[1])});k.on("snap.util.attr.filter",function(d){if(d instanceof v&&"filter"==d.type){k.stop();var f=d.node.id;f||(z(d.node,{id:d.id}),f=d.id);z(this.node,{filter:a.url(f)})}d&&"none"!=d||(k.stop(),this.node.removeAttribute("filter"))});a.filter.blur=function(d,f){null==d&&(d=2);return a.format('<feGaussianBlur stdDeviation="{def}"/>',{def:null==f?d:[d,f]})};a.filter.blur.toString=function(){return this()};a.filter.shadow=
function(d,f,k,u,p){"string"==typeof k&&(p=u=k,k=4);"string"!=typeof u&&(p=u,u="#000");null==k&&(k=4);null==p&&(p=1);null==d&&(d=0,f=2);null==f&&(f=d);u=a.color(u||"#000");return a.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>',
{color:u,dx:d,dy:f,blur:k,opacity:p})};a.filter.shadow.toString=function(){return this()};a.filter.grayscale=function(d){null==d&&(d=1);return a.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>',{a:0.2126+0.7874*(1-d),b:0.7152-0.7152*(1-d),c:0.0722-0.0722*(1-d),d:0.2126-0.2126*(1-d),e:0.7152+0.2848*(1-d),f:0.0722-0.0722*(1-d),g:0.2126-0.2126*(1-d),h:0.0722+0.9278*(1-d)})};a.filter.grayscale.toString=function(){return this()};a.filter.sepia=
function(d){null==d&&(d=1);return a.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>',{a:0.393+0.607*(1-d),b:0.769-0.769*(1-d),c:0.189-0.189*(1-d),d:0.349-0.349*(1-d),e:0.686+0.314*(1-d),f:0.168-0.168*(1-d),g:0.272-0.272*(1-d),h:0.534-0.534*(1-d),i:0.131+0.869*(1-d)})};a.filter.sepia.toString=function(){return this()};a.filter.saturate=function(d){null==d&&(d=1);return a.format('<feColorMatrix type="saturate" values="{amount}"/>',{amount:1-
d})};a.filter.saturate.toString=function(){return this()};a.filter.hueRotate=function(d){return a.format('<feColorMatrix type="hueRotate" values="{angle}"/>',{angle:d||0})};a.filter.hueRotate.toString=function(){return this()};a.filter.invert=function(d){null==d&&(d=1);return a.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>',{amount:d,
amount2:1-d})};a.filter.invert.toString=function(){return this()};a.filter.brightness=function(d){null==d&&(d=1);return a.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>',{amount:d})};a.filter.brightness.toString=function(){return this()};a.filter.contrast=function(d){null==d&&(d=1);return a.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>',
{amount:d,amount2:0.5-d/2})};a.filter.contrast.toString=function(){return this()}});return C});

]]> </script>
<script> <![CDATA[

(function (glob, factory) {
    // AMD support
    if (typeof define === "function" && define.amd) {
        // Define as an anonymous module
        define("Gadfly", ["Snap.svg"], function (Snap) {
            return factory(Snap);
        });
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        glob.Gadfly = factory(glob.Snap);
    }
}(this, function (Snap) {

var Gadfly = {};

// Get an x/y coordinate value in pixels
var xPX = function(fig, x) {
    var client_box = fig.node.getBoundingClientRect();
    return x * fig.node.viewBox.baseVal.width / client_box.width;
};

var yPX = function(fig, y) {
    var client_box = fig.node.getBoundingClientRect();
    return y * fig.node.viewBox.baseVal.height / client_box.height;
};


Snap.plugin(function (Snap, Element, Paper, global) {
    // Traverse upwards from a snap element to find and return the first
    // note with the "plotroot" class.
    Element.prototype.plotroot = function () {
        var element = this;
        while (!element.hasClass("plotroot") && element.parent() != null) {
            element = element.parent();
        }
        return element;
    };

    Element.prototype.svgroot = function () {
        var element = this;
        while (element.node.nodeName != "svg" && element.parent() != null) {
            element = element.parent();
        }
        return element;
    };

    Element.prototype.plotbounds = function () {
        var root = this.plotroot()
        var bbox = root.select(".guide.background").node.getBBox();
        return {
            x0: bbox.x,
            x1: bbox.x + bbox.width,
            y0: bbox.y,
            y1: bbox.y + bbox.height
        };
    };

    Element.prototype.plotcenter = function () {
        var root = this.plotroot()
        var bbox = root.select(".guide.background").node.getBBox();
        return {
            x: bbox.x + bbox.width / 2,
            y: bbox.y + bbox.height / 2
        };
    };

    // Emulate IE style mouseenter/mouseleave events, since Microsoft always
    // does everything right.
    // See: http://www.dynamic-tools.net/toolbox/isMouseLeaveOrEnter/
    var events = ["mouseenter", "mouseleave"];

    for (i in events) {
        (function (event_name) {
            var event_name = events[i];
            Element.prototype[event_name] = function (fn, scope) {
                if (Snap.is(fn, "function")) {
                    var fn2 = function (event) {
                        if (event.type != "mouseover" && event.type != "mouseout") {
                            return;
                        }

                        var reltg = event.relatedTarget ? event.relatedTarget :
                            event.type == "mouseout" ? event.toElement : event.fromElement;
                        while (reltg && reltg != this.node) reltg = reltg.parentNode;

                        if (reltg != this.node) {
                            return fn.apply(this, event);
                        }
                    };

                    if (event_name == "mouseenter") {
                        this.mouseover(fn2, scope);
                    } else {
                        this.mouseout(fn2, scope);
                    }
                }
                return this;
            };
        })(events[i]);
    }


    Element.prototype.mousewheel = function (fn, scope) {
        if (Snap.is(fn, "function")) {
            var el = this;
            var fn2 = function (event) {
                fn.apply(el, [event]);
            };
        }

        this.node.addEventListener(
            /Firefox/i.test(navigator.userAgent) ? "DOMMouseScroll" : "mousewheel",
            fn2);

        return this;
    };


    // Snap's attr function can be too slow for things like panning/zooming.
    // This is a function to directly update element attributes without going
    // through eve.
    Element.prototype.attribute = function(key, val) {
        if (val === undefined) {
            return this.node.getAttribute(key);
        } else {
            this.node.setAttribute(key, val);
            return this;
        }
    };

    Element.prototype.init_gadfly = function() {
        this.mouseenter(Gadfly.plot_mouseover)
            .mouseleave(Gadfly.plot_mouseout)
            .dblclick(Gadfly.plot_dblclick)
            .mousewheel(Gadfly.guide_background_scroll)
            .drag(Gadfly.guide_background_drag_onmove,
                  Gadfly.guide_background_drag_onstart,
                  Gadfly.guide_background_drag_onend);
        this.mouseenter(function (event) {
            init_pan_zoom(this.plotroot());
        });
        return this;
    };
});


// When the plot is moused over, emphasize the grid lines.
Gadfly.plot_mouseover = function(event) {
    var root = this.plotroot();

    var keyboard_zoom = function(event) {
        if (event.which == 187) { // plus
            increase_zoom_by_position(root, 0.1, true);
        } else if (event.which == 189) { // minus
            increase_zoom_by_position(root, -0.1, true);
        }
    };
    root.data("keyboard_zoom", keyboard_zoom);
    window.addEventListener("keyup", keyboard_zoom);

    var xgridlines = root.select(".xgridlines"),
        ygridlines = root.select(".ygridlines");

    xgridlines.data("unfocused_strokedash",
                    xgridlines.attribute("stroke-dasharray").replace(/(\d)(,|$)/g, "$1mm$2"));
    ygridlines.data("unfocused_strokedash",
                    ygridlines.attribute("stroke-dasharray").replace(/(\d)(,|$)/g, "$1mm$2"));

    // emphasize grid lines
    var destcolor = root.data("focused_xgrid_color");
    xgridlines.attribute("stroke-dasharray", "none")
              .selectAll("path")
              .animate({stroke: destcolor}, 250);

    destcolor = root.data("focused_ygrid_color");
    ygridlines.attribute("stroke-dasharray", "none")
              .selectAll("path")
              .animate({stroke: destcolor}, 250);

    // reveal zoom slider
    root.select(".zoomslider")
        .animate({opacity: 1.0}, 250);
};

// Reset pan and zoom on double click
Gadfly.plot_dblclick = function(event) {
  set_plot_pan_zoom(this.plotroot(), 0.0, 0.0, 1.0);
};

// Unemphasize grid lines on mouse out.
Gadfly.plot_mouseout = function(event) {
    var root = this.plotroot();

    window.removeEventListener("keyup", root.data("keyboard_zoom"));
    root.data("keyboard_zoom", undefined);

    var xgridlines = root.select(".xgridlines"),
        ygridlines = root.select(".ygridlines");

    var destcolor = root.data("unfocused_xgrid_color");

    xgridlines.attribute("stroke-dasharray", xgridlines.data("unfocused_strokedash"))
              .selectAll("path")
              .animate({stroke: destcolor}, 250);

    destcolor = root.data("unfocused_ygrid_color");
    ygridlines.attribute("stroke-dasharray", ygridlines.data("unfocused_strokedash"))
              .selectAll("path")
              .animate({stroke: destcolor}, 250);

    // hide zoom slider
    root.select(".zoomslider")
        .animate({opacity: 0.0}, 250);
};


var set_geometry_transform = function(root, tx, ty, scale) {
    var xscalable = root.hasClass("xscalable"),
        yscalable = root.hasClass("yscalable");

    var old_scale = root.data("scale");

    var xscale = xscalable ? scale : 1.0,
        yscale = yscalable ? scale : 1.0;

    tx = xscalable ? tx : 0.0;
    ty = yscalable ? ty : 0.0;

    var t = new Snap.Matrix().translate(tx, ty).scale(xscale, yscale);

    root.selectAll(".geometry, image")
        .forEach(function (element, i) {
            element.transform(t);
        });

    bounds = root.plotbounds();

    if (yscalable) {
        var xfixed_t = new Snap.Matrix().translate(0, ty).scale(1.0, yscale);
        root.selectAll(".xfixed")
            .forEach(function (element, i) {
                element.transform(xfixed_t);
            });

        root.select(".ylabels")
            .transform(xfixed_t)
            .selectAll("text")
            .forEach(function (element, i) {
                if (element.attribute("gadfly:inscale") == "true") {
                    var cx = element.asPX("x"),
                        cy = element.asPX("y");
                    var st = element.data("static_transform");
                    unscale_t = new Snap.Matrix();
                    unscale_t.scale(1, 1/scale, cx, cy).add(st);
                    element.transform(unscale_t);

                    var y = cy * scale + ty;
                    element.attr("visibility",
                        bounds.y0 <= y && y <= bounds.y1 ? "visible" : "hidden");
                }
            });
    }

    if (xscalable) {
        var yfixed_t = new Snap.Matrix().translate(tx, 0).scale(xscale, 1.0);
        var xtrans = new Snap.Matrix().translate(tx, 0);
        root.selectAll(".yfixed")
            .forEach(function (element, i) {
                element.transform(yfixed_t);
            });

        root.select(".xlabels")
            .transform(yfixed_t)
            .selectAll("text")
            .forEach(function (element, i) {
                if (element.attribute("gadfly:inscale") == "true") {
                    var cx = element.asPX("x"),
                        cy = element.asPX("y");
                    var st = element.data("static_transform");
                    unscale_t = new Snap.Matrix();
                    unscale_t.scale(1/scale, 1, cx, cy).add(st);

                    element.transform(unscale_t);

                    var x = cx * scale + tx;
                    element.attr("visibility",
                        bounds.x0 <= x && x <= bounds.x1 ? "visible" : "hidden");
                    }
            });
    }

    // we must unscale anything that is scale invariance: widths, raiduses, etc.
    var size_attribs = ["font-size"];
    var unscaled_selection = ".geometry, .geometry *";
    if (xscalable) {
        size_attribs.push("rx");
        unscaled_selection += ", .xgridlines";
    }
    if (yscalable) {
        size_attribs.push("ry");
        unscaled_selection += ", .ygridlines";
    }

    root.selectAll(unscaled_selection)
        .forEach(function (element, i) {
            // circle need special help
            if (element.node.nodeName == "circle") {
                var cx = element.attribute("cx"),
                    cy = element.attribute("cy");
                unscale_t = new Snap.Matrix().scale(1/xscale, 1/yscale,
                                                        cx, cy);
                element.transform(unscale_t);
                return;
            }

            for (i in size_attribs) {
                var key = size_attribs[i];
                var val = parseFloat(element.attribute(key));
                if (val !== undefined && val != 0 && !isNaN(val)) {
                    element.attribute(key, val * old_scale / scale);
                }
            }
        });
};


// Find the most appropriate tick scale and update label visibility.
var update_tickscale = function(root, scale, axis) {
    if (!root.hasClass(axis + "scalable")) return;

    var tickscales = root.data(axis + "tickscales");
    var best_tickscale = 1.0;
    var best_tickscale_dist = Infinity;
    for (tickscale in tickscales) {
        var dist = Math.abs(Math.log(tickscale) - Math.log(scale));
        if (dist < best_tickscale_dist) {
            best_tickscale_dist = dist;
            best_tickscale = tickscale;
        }
    }

    if (best_tickscale != root.data(axis + "tickscale")) {
        root.data(axis + "tickscale", best_tickscale);
        var mark_inscale_gridlines = function (element, i) {
            var inscale = element.attr("gadfly:scale") == best_tickscale;
            element.attribute("gadfly:inscale", inscale);
            element.attr("visibility", inscale ? "visible" : "hidden");
        };

        var mark_inscale_labels = function (element, i) {
            var inscale = element.attr("gadfly:scale") == best_tickscale;
            element.attribute("gadfly:inscale", inscale);
            element.attr("visibility", inscale ? "visible" : "hidden");
        };

        root.select("." + axis + "gridlines").selectAll("path").forEach(mark_inscale_gridlines);
        root.select("." + axis + "labels").selectAll("text").forEach(mark_inscale_labels);
    }
};


var set_plot_pan_zoom = function(root, tx, ty, scale) {
    var old_scale = root.data("scale");
    var bounds = root.plotbounds();

    var width = bounds.x1 - bounds.x0,
        height = bounds.y1 - bounds.y0;

    // compute the viewport derived from tx, ty, and scale
    var x_min = -width * scale - (scale * width - width),
        x_max = width * scale,
        y_min = -height * scale - (scale * height - height),
        y_max = height * scale;

    var x0 = bounds.x0 - scale * bounds.x0,
        y0 = bounds.y0 - scale * bounds.y0;

    var tx = Math.max(Math.min(tx - x0, x_max), x_min),
        ty = Math.max(Math.min(ty - y0, y_max), y_min);

    tx += x0;
    ty += y0;

    // when the scale change, we may need to alter which set of
    // ticks is being displayed
    if (scale != old_scale) {
        update_tickscale(root, scale, "x");
        update_tickscale(root, scale, "y");
    }

    set_geometry_transform(root, tx, ty, scale);

    root.data("scale", scale);
    root.data("tx", tx);
    root.data("ty", ty);
};


var scale_centered_translation = function(root, scale) {
    var bounds = root.plotbounds();

    var width = bounds.x1 - bounds.x0,
        height = bounds.y1 - bounds.y0;

    var tx0 = root.data("tx"),
        ty0 = root.data("ty");

    var scale0 = root.data("scale");

    // how off from center the current view is
    var xoff = tx0 - (bounds.x0 * (1 - scale0) + (width * (1 - scale0)) / 2),
        yoff = ty0 - (bounds.y0 * (1 - scale0) + (height * (1 - scale0)) / 2);

    // rescale offsets
    xoff = xoff * scale / scale0;
    yoff = yoff * scale / scale0;

    // adjust for the panel position being scaled
    var x_edge_adjust = bounds.x0 * (1 - scale),
        y_edge_adjust = bounds.y0 * (1 - scale);

    return {
        x: xoff + x_edge_adjust + (width - width * scale) / 2,
        y: yoff + y_edge_adjust + (height - height * scale) / 2
    };
};


// Initialize data for panning zooming if it isn't already.
var init_pan_zoom = function(root) {
    if (root.data("zoompan-ready")) {
        return;
    }

    // The non-scaling-stroke trick. Rather than try to correct for the
    // stroke-width when zooming, we force it to a fixed value.
    var px_per_mm = root.node.getCTM().a;

    // Drag events report deltas in pixels, which we'd like to convert to
    // millimeters.
    root.data("px_per_mm", px_per_mm);

    root.selectAll("path")
        .forEach(function (element, i) {
        sw = element.asPX("stroke-width") * px_per_mm;
        if (sw > 0) {
            element.attribute("stroke-width", sw);
            element.attribute("vector-effect", "non-scaling-stroke");
        }
    });

    // Store ticks labels original tranformation
    root.selectAll(".xlabels > text, .ylabels > text")
        .forEach(function (element, i) {
            var lm = element.transform().localMatrix;
            element.data("static_transform",
                new Snap.Matrix(lm.a, lm.b, lm.c, lm.d, lm.e, lm.f));
        });

    var xgridlines = root.select(".xgridlines");
    var ygridlines = root.select(".ygridlines");
    var xlabels = root.select(".xlabels");
    var ylabels = root.select(".ylabels");

    if (root.data("tx") === undefined) root.data("tx", 0);
    if (root.data("ty") === undefined) root.data("ty", 0);
    if (root.data("scale") === undefined) root.data("scale", 1.0);
    if (root.data("xtickscales") === undefined) {

        // index all the tick scales that are listed
        var xtickscales = {};
        var ytickscales = {};
        var add_x_tick_scales = function (element, i) {
            xtickscales[element.attribute("gadfly:scale")] = true;
        };
        var add_y_tick_scales = function (element, i) {
            ytickscales[element.attribute("gadfly:scale")] = true;
        };

        if (xgridlines) xgridlines.selectAll("path").forEach(add_x_tick_scales);
        if (ygridlines) ygridlines.selectAll("path").forEach(add_y_tick_scales);
        if (xlabels) xlabels.selectAll("text").forEach(add_x_tick_scales);
        if (ylabels) ylabels.selectAll("text").forEach(add_y_tick_scales);

        root.data("xtickscales", xtickscales);
        root.data("ytickscales", ytickscales);
        root.data("xtickscale", 1.0);
    }

    var min_scale = 1.0, max_scale = 1.0;
    for (scale in xtickscales) {
        min_scale = Math.min(min_scale, scale);
        max_scale = Math.max(max_scale, scale);
    }
    for (scale in ytickscales) {
        min_scale = Math.min(min_scale, scale);
        max_scale = Math.max(max_scale, scale);
    }
    root.data("min_scale", min_scale);
    root.data("max_scale", max_scale);

    // store the original positions of labels
    if (xlabels) {
        xlabels.selectAll("text")
               .forEach(function (element, i) {
                   element.data("x", element.asPX("x"));
               });
    }

    if (ylabels) {
        ylabels.selectAll("text")
               .forEach(function (element, i) {
                   element.data("y", element.asPX("y"));
               });
    }

    // mark grid lines and ticks as in or out of scale.
    var mark_inscale = function (element, i) {
        element.attribute("gadfly:inscale", element.attribute("gadfly:scale") == 1.0);
    };

    if (xgridlines) xgridlines.selectAll("path").forEach(mark_inscale);
    if (ygridlines) ygridlines.selectAll("path").forEach(mark_inscale);
    if (xlabels) xlabels.selectAll("text").forEach(mark_inscale);
    if (ylabels) ylabels.selectAll("text").forEach(mark_inscale);

    // figure out the upper ond lower bounds on panning using the maximum
    // and minum grid lines
    var bounds = root.plotbounds();
    var pan_bounds = {
        x0: 0.0,
        y0: 0.0,
        x1: 0.0,
        y1: 0.0
    };

    if (xgridlines) {
        xgridlines
            .selectAll("path")
            .forEach(function (element, i) {
                if (element.attribute("gadfly:inscale") == "true") {
                    var bbox = element.node.getBBox();
                    if (bounds.x1 - bbox.x < pan_bounds.x0) {
                        pan_bounds.x0 = bounds.x1 - bbox.x;
                    }
                    if (bounds.x0 - bbox.x > pan_bounds.x1) {
                        pan_bounds.x1 = bounds.x0 - bbox.x;
                    }
                    element.attr("visibility", "visible");
                }
            });
    }

    if (ygridlines) {
        ygridlines
            .selectAll("path")
            .forEach(function (element, i) {
                if (element.attribute("gadfly:inscale") == "true") {
                    var bbox = element.node.getBBox();
                    if (bounds.y1 - bbox.y < pan_bounds.y0) {
                        pan_bounds.y0 = bounds.y1 - bbox.y;
                    }
                    if (bounds.y0 - bbox.y > pan_bounds.y1) {
                        pan_bounds.y1 = bounds.y0 - bbox.y;
                    }
                    element.attr("visibility", "visible");
                }
            });
    }

    // nudge these values a little
    pan_bounds.x0 -= 5;
    pan_bounds.x1 += 5;
    pan_bounds.y0 -= 5;
    pan_bounds.y1 += 5;
    root.data("pan_bounds", pan_bounds);

    root.data("zoompan-ready", true)
};


// drag actions, i.e. zooming and panning
var pan_action = {
    start: function(root, x, y, event) {
        root.data("dx", 0);
        root.data("dy", 0);
        root.data("tx0", root.data("tx"));
        root.data("ty0", root.data("ty"));
    },
    update: function(root, dx, dy, x, y, event) {
        var px_per_mm = root.data("px_per_mm");
        dx /= px_per_mm;
        dy /= px_per_mm;

        var tx0 = root.data("tx"),
            ty0 = root.data("ty");

        var dx0 = root.data("dx"),
            dy0 = root.data("dy");

        root.data("dx", dx);
        root.data("dy", dy);

        dx = dx - dx0;
        dy = dy - dy0;

        var tx = tx0 + dx,
            ty = ty0 + dy;

        set_plot_pan_zoom(root, tx, ty, root.data("scale"));
    },
    end: function(root, event) {

    },
    cancel: function(root) {
        set_plot_pan_zoom(root, root.data("tx0"), root.data("ty0"), root.data("scale"));
    }
};

var zoom_box;
var zoom_action = {
    start: function(root, x, y, event) {
        var bounds = root.plotbounds();
        var width = bounds.x1 - bounds.x0,
            height = bounds.y1 - bounds.y0;
        var ratio = width / height;
        var xscalable = root.hasClass("xscalable"),
            yscalable = root.hasClass("yscalable");
        var px_per_mm = root.data("px_per_mm");
        x = xscalable ? x / px_per_mm : bounds.x0;
        y = yscalable ? y / px_per_mm : bounds.y0;
        var w = xscalable ? 0 : width;
        var h = yscalable ? 0 : height;
        zoom_box = root.rect(x, y, w, h).attr({
            "fill": "#000",
            "opacity": 0.25
        });
        zoom_box.data("ratio", ratio);
    },
    update: function(root, dx, dy, x, y, event) {
        var xscalable = root.hasClass("xscalable"),
            yscalable = root.hasClass("yscalable");
        var px_per_mm = root.data("px_per_mm");
        var bounds = root.plotbounds();
        if (yscalable) {
            y /= px_per_mm;
            y = Math.max(bounds.y0, y);
            y = Math.min(bounds.y1, y);
        } else {
            y = bounds.y1;
        }
        if (xscalable) {
            x /= px_per_mm;
            x = Math.max(bounds.x0, x);
            x = Math.min(bounds.x1, x);
        } else {
            x = bounds.x1;
        }

        dx = x - zoom_box.attr("x");
        dy = y - zoom_box.attr("y");
        if (xscalable && yscalable) {
            var ratio = zoom_box.data("ratio");
            var width = Math.min(Math.abs(dx), ratio * Math.abs(dy));
            var height = Math.min(Math.abs(dy), Math.abs(dx) / ratio);
            dx = width * dx / Math.abs(dx);
            dy = height * dy / Math.abs(dy);
        }
        var xoffset = 0,
            yoffset = 0;
        if (dx < 0) {
            xoffset = dx;
            dx = -1 * dx;
        }
        if (dy < 0) {
            yoffset = dy;
            dy = -1 * dy;
        }
        if (isNaN(dy)) {
            dy = 0.0;
        }
        if (isNaN(dx)) {
            dx = 0.0;
        }
        zoom_box.transform("T" + xoffset + "," + yoffset);
        zoom_box.attr("width", dx);
        zoom_box.attr("height", dy);
    },
    end: function(root, event) {
        var xscalable = root.hasClass("xscalable"),
            yscalable = root.hasClass("yscalable");
        var zoom_bounds = zoom_box.getBBox();
        if (zoom_bounds.width * zoom_bounds.height <= 0) {
            return;
        }
        var plot_bounds = root.plotbounds();
        var zoom_factor = 1.0;
        if (yscalable) {
            zoom_factor = (plot_bounds.y1 - plot_bounds.y0) / zoom_bounds.height;
        } else {
            zoom_factor = (plot_bounds.x1 - plot_bounds.x0) / zoom_bounds.width;
        }
        var tx = (root.data("tx") - zoom_bounds.x) * zoom_factor + plot_bounds.x0,
            ty = (root.data("ty") - zoom_bounds.y) * zoom_factor + plot_bounds.y0;
        set_plot_pan_zoom(root, tx, ty, root.data("scale") * zoom_factor);
        zoom_box.remove();
    },
    cancel: function(root) {
        zoom_box.remove();
    }
};


Gadfly.guide_background_drag_onstart = function(x, y, event) {
    var root = this.plotroot();
    var scalable = root.hasClass("xscalable") || root.hasClass("yscalable");
    var zoomable = !event.altKey && !event.ctrlKey && event.shiftKey && scalable;
    var panable = !event.altKey && !event.ctrlKey && !event.shiftKey && scalable;
    var drag_action = zoomable ? zoom_action :
                      panable  ? pan_action :
                                 undefined;
    root.data("drag_action", drag_action);
    if (drag_action) {
        var cancel_drag_action = function(event) {
            if (event.which == 27) { // esc key
                drag_action.cancel(root);
                root.data("drag_action", undefined);
            }
        };
        window.addEventListener("keyup", cancel_drag_action);
        root.data("cancel_drag_action", cancel_drag_action);
        drag_action.start(root, x, y, event);
    }
};


Gadfly.guide_background_drag_onmove = function(dx, dy, x, y, event) {
    var root = this.plotroot();
    var drag_action = root.data("drag_action");
    if (drag_action) {
        drag_action.update(root, dx, dy, x, y, event);
    }
};


Gadfly.guide_background_drag_onend = function(event) {
    var root = this.plotroot();
    window.removeEventListener("keyup", root.data("cancel_drag_action"));
    root.data("cancel_drag_action", undefined);
    var drag_action = root.data("drag_action");
    if (drag_action) {
        drag_action.end(root, event);
    }
    root.data("drag_action", undefined);
};


Gadfly.guide_background_scroll = function(event) {
    if (event.shiftKey) {
        increase_zoom_by_position(this.plotroot(), 0.001 * event.wheelDelta);
        event.preventDefault();
    }
};


Gadfly.zoomslider_button_mouseover = function(event) {
    this.select(".button_logo")
         .animate({fill: this.data("mouseover_color")}, 100);
};


Gadfly.zoomslider_button_mouseout = function(event) {
     this.select(".button_logo")
         .animate({fill: this.data("mouseout_color")}, 100);
};


Gadfly.zoomslider_zoomout_click = function(event) {
    increase_zoom_by_position(this.plotroot(), -0.1, true);
};


Gadfly.zoomslider_zoomin_click = function(event) {
    increase_zoom_by_position(this.plotroot(), 0.1, true);
};


Gadfly.zoomslider_track_click = function(event) {
    // TODO
};


// Map slider position x to scale y using the function y = a*exp(b*x)+c.
// The constants a, b, and c are solved using the constraint that the function
// should go through the points (0; min_scale), (0.5; 1), and (1; max_scale).
var scale_from_slider_position = function(position, min_scale, max_scale) {
    var a = (1 - 2 * min_scale + min_scale * min_scale) / (min_scale + max_scale - 2),
        b = 2 * Math.log((max_scale - 1) / (1 - min_scale)),
        c = (min_scale * max_scale - 1) / (min_scale + max_scale - 2);
    return a * Math.exp(b * position) + c;
}

// inverse of scale_from_slider_position
var slider_position_from_scale = function(scale, min_scale, max_scale) {
    var a = (1 - 2 * min_scale + min_scale * min_scale) / (min_scale + max_scale - 2),
        b = 2 * Math.log((max_scale - 1) / (1 - min_scale)),
        c = (min_scale * max_scale - 1) / (min_scale + max_scale - 2);
    return 1 / b * Math.log((scale - c) / a);
}

var increase_zoom_by_position = function(root, delta_position, animate) {
    var scale = root.data("scale"),
        min_scale = root.data("min_scale"),
        max_scale = root.data("max_scale");
    var position = slider_position_from_scale(scale, min_scale, max_scale);
    position += delta_position;
    scale = scale_from_slider_position(position, min_scale, max_scale);
    set_zoom(root, scale, animate);
}

var set_zoom = function(root, scale, animate) {
    var min_scale = root.data("min_scale"),
        max_scale = root.data("max_scale"),
        old_scale = root.data("scale");
    var new_scale = Math.max(min_scale, Math.min(scale, max_scale));
    if (animate) {
        Snap.animate(
            old_scale,
            new_scale,
            function (new_scale) {
                update_plot_scale(root, new_scale);
            },
            200);
    } else {
        update_plot_scale(root, new_scale);
    }
}


var update_plot_scale = function(root, new_scale) {
    var trans = scale_centered_translation(root, new_scale);
    set_plot_pan_zoom(root, trans.x, trans.y, new_scale);

    root.selectAll(".zoomslider_thumb")
        .forEach(function (element, i) {
            var min_pos = element.data("min_pos"),
                max_pos = element.data("max_pos"),
                min_scale = root.data("min_scale"),
                max_scale = root.data("max_scale");
            var xmid = (min_pos + max_pos) / 2;
            var xpos = slider_position_from_scale(new_scale, min_scale, max_scale);
            element.transform(new Snap.Matrix().translate(
                Math.max(min_pos, Math.min(
                         max_pos, min_pos + (max_pos - min_pos) * xpos)) - xmid, 0));
    });
};


Gadfly.zoomslider_thumb_dragmove = function(dx, dy, x, y, event) {
    var root = this.plotroot();
    var min_pos = this.data("min_pos"),
        max_pos = this.data("max_pos"),
        min_scale = root.data("min_scale"),
        max_scale = root.data("max_scale"),
        old_scale = root.data("old_scale");

    var px_per_mm = root.data("px_per_mm");
    dx /= px_per_mm;
    dy /= px_per_mm;

    var xmid = (min_pos + max_pos) / 2;
    var xpos = slider_position_from_scale(old_scale, min_scale, max_scale) +
                   dx / (max_pos - min_pos);

    // compute the new scale
    var new_scale = scale_from_slider_position(xpos, min_scale, max_scale);
    new_scale = Math.min(max_scale, Math.max(min_scale, new_scale));

    update_plot_scale(root, new_scale);
    event.stopPropagation();
};


Gadfly.zoomslider_thumb_dragstart = function(x, y, event) {
    this.animate({fill: this.data("mouseover_color")}, 100);
    var root = this.plotroot();

    // keep track of what the scale was when we started dragging
    root.data("old_scale", root.data("scale"));
    event.stopPropagation();
};


Gadfly.zoomslider_thumb_dragend = function(event) {
    this.animate({fill: this.data("mouseout_color")}, 100);
    event.stopPropagation();
};


var toggle_color_class = function(root, color_class, ison) {
    var guides = root.selectAll(".guide." + color_class + ",.guide ." + color_class);
    var geoms = root.selectAll(".geometry." + color_class + ",.geometry ." + color_class);
    if (ison) {
        guides.animate({opacity: 0.5}, 250);
        geoms.animate({opacity: 0.0}, 250);
    } else {
        guides.animate({opacity: 1.0}, 250);
        geoms.animate({opacity: 1.0}, 250);
    }
};


Gadfly.colorkey_swatch_click = function(event) {
    var root = this.plotroot();
    var color_class = this.data("color_class");

    if (event.shiftKey) {
        root.selectAll(".colorkey text")
            .forEach(function (element) {
                var other_color_class = element.data("color_class");
                if (other_color_class != color_class) {
                    toggle_color_class(root, other_color_class,
                                       element.attr("opacity") == 1.0);
                }
            });
    } else {
        toggle_color_class(root, color_class, this.attr("opacity") == 1.0);
    }
};


return Gadfly;

}));


//@ sourceURL=gadfly.js

(function (glob, factory) {
    // AMD support
      if (typeof require === "function" && typeof define === "function" && define.amd) {
        require(["Snap.svg", "Gadfly"], function (Snap, Gadfly) {
            factory(Snap, Gadfly);
        });
      } else {
          factory(glob.Snap, glob.Gadfly);
      }
})(window, function (Snap, Gadfly) {
    var fig = Snap("#fig-3a6dd25ad25c4037a166889ee51bb151");
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-8")
   .init_gadfly();
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-11")
   .plotroot().data("unfocused_ygrid_color", "#D0D0E0")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-11")
   .plotroot().data("focused_ygrid_color", "#A0A0A0")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-12")
   .plotroot().data("unfocused_xgrid_color", "#D0D0E0")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-12")
   .plotroot().data("focused_xgrid_color", "#A0A0A0")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-16")
   .data("mouseover_color", "#CD5C5C")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-16")
   .data("mouseout_color", "#6A6A6A")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-16")
   .click(Gadfly.zoomslider_zoomin_click)
.mouseenter(Gadfly.zoomslider_button_mouseover)
.mouseleave(Gadfly.zoomslider_button_mouseout)
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-18")
   .data("max_pos", 111.58)
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-18")
   .data("min_pos", 94.58)
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-18")
   .click(Gadfly.zoomslider_track_click);
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-19")
   .data("max_pos", 111.58)
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-19")
   .data("min_pos", 94.58)
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-19")
   .data("mouseover_color", "#CD5C5C")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-19")
   .data("mouseout_color", "#6A6A6A")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-19")
   .drag(Gadfly.zoomslider_thumb_dragmove,
     Gadfly.zoomslider_thumb_dragstart,
     Gadfly.zoomslider_thumb_dragend)
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-20")
   .data("mouseover_color", "#CD5C5C")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-20")
   .data("mouseout_color", "#6A6A6A")
;
fig.select("#fig-3a6dd25ad25c4037a166889ee51bb151-element-20")
   .click(Gadfly.zoomslider_zoomout_click)
.mouseenter(Gadfly.zoomslider_button_mouseover)
.mouseleave(Gadfly.zoomslider_button_mouseout)
;
    });
]]> </script>
</svg>




### Computing the term structure

Now that we've got the basic motion set up, let's start making things a bit more sophisticated for the model. We're going to assume that the drift of the stock is the difference between the implied forward rate and the quarterly dividend rate.

We're given the yearly term structure, and need to calculate the quarterly forward rate to match this structure. The term structure is assumed to follow:

$d(0, t) = d(0,t-1)\cdot f_{i-1, i}$

Where $f_{i-1, i}$ is the quarterly forward rate.


```julia
forward_term = function(yearly_term)
    # It is assumed that we have a yearly term structure passed in, and starts at year 0
    # This implies a nominal rate above 0 for the first year!
    years = length(term)-1 # because we start at 0
    structure = [(term[i+1] / term[i]) for i=1:years]
end;
```

### Illustrating the term structure

Now that we've got our term structure, let's validate that we're getting the correct results! If we've done this correctly, then:

```
term[2] == term[1] * structure[1]
```


```julia
# Example term structure taken from:
# http://www.treasury.gov/resource-center/data-chart-center/interest-rates/Pages/TextView.aspx?data=yield
# Linear interpolation used years in-between periods, assuming real-dollar
# interest rates
forward_yield = forward_term(term)
calculated_term2 = term[1] * forward_yield[1]

println("Actual term[2]: $(term[2]); Calculated term[2]: $(calculated_term2)")
```

    Actual term[2]: 1.0049; Calculated term[2]: 1.0049


### The full underlying simulation

Now that we have the term structure set up, we can actually start doing some real simulation! Let's construct some paths through the full 5-year time frame. In order to do this, we will simulate 1 year at a time, and use the forward rates at those times to compute the drift. Thus, there will be 5 total simulations batched together.


```julia
full_motion = ones(5) * S0
full_term = vcat(term[1], forward_yield)
for i=1:T
    μ = (full_term[i] - 1 - q)
    year_motion = simulate_gbm(full_motion[:,end], μ, σ, 1, n)
    full_motion = hcat(full_motion, year_motion)
end

display_motion(full_motion, T)
```




<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:gadfly="http://www.gadflyjl.org/ns"
     version="1.2"
     width="141.42mm" height="100mm" viewBox="0 0 141.42 100"
     stroke="none"
     fill="#000000"
     stroke-width="0.3"
     font-size="3.88"

     id="fig-0378e04b897742b597befd2e8e1c169e">
<g class="plotroot xscalable yscalable" id="fig-0378e04b897742b597befd2e8e1c169e-element-1">
  <g font-size="3.88" font-family="'PT Sans','Helvetica Neue','Helvetica',sans-serif" fill="#564A55" stroke="#000000" stroke-opacity="0.000" id="fig-0378e04b897742b597befd2e8e1c169e-element-2">
    <text x="73.61" y="88.39" text-anchor="middle" dy="0.6em">Years</text>
  </g>
  <g class="guide colorkey" id="fig-0378e04b897742b597befd2e8e1c169e-element-3">
    <g font-size="2.82" font-family="'PT Sans','Helvetica Neue','Helvetica',sans-serif" fill="#4C404B" id="fig-0378e04b897742b597befd2e8e1c169e-element-4">
      <text x="131.9" y="66.46" dy="0.35em">1</text>
      <text x="131.9" y="39.15" dy="0.35em">5</text>
      <text x="131.9" y="59.63" dy="0.35em">2</text>
      <text x="131.9" y="52.81" dy="0.35em">3</text>
      <text x="131.9" y="45.98" dy="0.35em">4</text>
    </g>
    <g shape-rendering="crispEdges" stroke="#000000" stroke-opacity="0.000" id="fig-0378e04b897742b597befd2e8e1c169e-element-5">
      <rect x="129.58" y="65.78" width="1.31" height="0.68" fill="#004D84"/>
      <rect x="129.58" y="65.1" width="1.31" height="0.68" fill="#005B8D"/>
      <rect x="129.58" y="64.41" width="1.31" height="0.68" fill="#006995"/>
      <rect x="129.58" y="63.73" width="1.31" height="0.68" fill="#00769D"/>
      <rect x="129.58" y="63.05" width="1.31" height="0.68" fill="#0083A3"/>
      <rect x="129.58" y="62.36" width="1.31" height="0.68" fill="#278FA9"/>
      <rect x="129.58" y="61.68" width="1.31" height="0.68" fill="#409BAF"/>
      <rect x="129.58" y="61" width="1.31" height="0.68" fill="#55A7B5"/>
      <rect x="129.58" y="60.32" width="1.31" height="0.68" fill="#69B2BA"/>
      <rect x="129.58" y="59.63" width="1.31" height="0.68" fill="#7BBCC0"/>
      <rect x="129.58" y="58.95" width="1.31" height="0.68" fill="#8DC6C5"/>
      <rect x="129.58" y="58.27" width="1.31" height="0.68" fill="#9ED0CB"/>
      <rect x="129.58" y="57.59" width="1.31" height="0.68" fill="#A5CFC7"/>
      <rect x="129.58" y="56.9" width="1.31" height="0.68" fill="#ABCEC4"/>
      <rect x="129.58" y="56.22" width="1.31" height="0.68" fill="#B1CCC2"/>
      <rect x="129.58" y="55.54" width="1.31" height="0.68" fill="#B5CCC1"/>
      <rect x="129.58" y="54.85" width="1.31" height="0.68" fill="#B7CBBF"/>
      <rect x="129.58" y="54.17" width="1.31" height="0.68" fill="#B9CBBD"/>
      <rect x="129.58" y="53.49" width="1.31" height="0.68" fill="#BBCBBB"/>
      <rect x="129.58" y="52.81" width="1.31" height="0.68" fill="#BDCABA"/>
      <rect x="129.58" y="52.12" width="1.31" height="0.68" fill="#BFCAB8"/>
      <rect x="129.58" y="51.44" width="1.31" height="0.68" fill="#C2C9B7"/>
      <rect x="129.58" y="50.76" width="1.31" height="0.68" fill="#C4C9B6"/>
      <rect x="129.58" y="50.07" width="1.31" height="0.68" fill="#C6C8B5"/>
      <rect x="129.58" y="49.39" width="1.31" height="0.68" fill="#C9C7B4"/>
      <rect x="129.58" y="48.71" width="1.31" height="0.68" fill="#CCC7B2"/>
      <rect x="129.58" y="48.03" width="1.31" height="0.68" fill="#CFC6AE"/>
      <rect x="129.58" y="47.34" width="1.31" height="0.68" fill="#D4C5AA"/>
      <rect x="129.58" y="46.66" width="1.31" height="0.68" fill="#D8C3A6"/>
      <rect x="129.58" y="45.98" width="1.31" height="0.68" fill="#D3B79A"/>
      <rect x="129.58" y="45.3" width="1.31" height="0.68" fill="#CDAB8E"/>
      <rect x="129.58" y="44.61" width="1.31" height="0.68" fill="#C89E82"/>
      <rect x="129.58" y="43.93" width="1.31" height="0.68" fill="#C19177"/>
      <rect x="129.58" y="43.25" width="1.31" height="0.68" fill="#BA836C"/>
      <rect x="129.58" y="42.56" width="1.31" height="0.68" fill="#B27563"/>
      <rect x="129.58" y="41.88" width="1.31" height="0.68" fill="#AA665A"/>
      <rect x="129.58" y="41.2" width="1.31" height="0.68" fill="#A05752"/>
      <rect x="129.58" y="40.52" width="1.31" height="0.68" fill="#96484A"/>
      <rect x="129.58" y="39.83" width="1.31" height="0.68" fill="#8B3844"/>
      <rect x="129.58" y="39.15" width="1.31" height="0.68" fill="#7E273E"/>
      <g stroke="#FFFFFF" stroke-width="0.2" id="fig-0378e04b897742b597befd2e8e1c169e-element-6">
        <path fill="none" d="M129.58,66.46 L 130.9 66.46"/>
        <path fill="none" d="M129.58,39.15 L 130.9 39.15"/>
        <path fill="none" d="M129.58,59.63 L 130.9 59.63"/>
        <path fill="none" d="M129.58,52.81 L 130.9 52.81"/>
        <path fill="none" d="M129.58,45.98 L 130.9 45.98"/>
      </g>
    </g>
    <g fill="#362A35" font-size="3.88" font-family="'PT Sans','Helvetica Neue','Helvetica',sans-serif" stroke="#000000" stroke-opacity="0.000" id="fig-0378e04b897742b597befd2e8e1c169e-element-7">
      <text x="129.58" y="35.15">Color</text>
    </g>
  </g>
  <g clip-path="url(#fig-0378e04b897742b597befd2e8e1c169e-element-9)" id="fig-0378e04b897742b597befd2e8e1c169e-element-8">
    <g pointer-events="visible" opacity="1" fill="#000000" fill-opacity="0.000" stroke="#000000" stroke-opacity="0.000" class="guide background" id="fig-0378e04b897742b597befd2e8e1c169e-element-10">
      <rect x="19.63" y="5" width="107.95" height="80.39"/>
    </g>
    <g class="guide ygridlines xfixed" stroke-dasharray="0.5,0.5" stroke-width="0.2" stroke="#D0D0E0" id="fig-0378e04b897742b597befd2e8e1c169e-element-11">
      <path fill="none" d="M19.63,178.87 L 127.58 178.87" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,159.78 L 127.58 159.78" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,140.68 L 127.58 140.68" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,121.58 L 127.58 121.58" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,102.49 L 127.58 102.49" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,83.39 L 127.58 83.39" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,64.29 L 127.58 64.29" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,45.19 L 127.58 45.19" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,26.1 L 127.58 26.1" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,7 L 127.58 7" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-12.1 L 127.58 -12.1" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-31.19 L 127.58 -31.19" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-50.29 L 127.58 -50.29" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-69.39 L 127.58 -69.39" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,-88.49 L 127.58 -88.49" visibility="hidden" gadfly:scale="1.0"/>
      <path fill="none" d="M19.63,159.78 L 127.58 159.78" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,155.96 L 127.58 155.96" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,152.14 L 127.58 152.14" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,148.32 L 127.58 148.32" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,144.5 L 127.58 144.5" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,140.68 L 127.58 140.68" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,136.86 L 127.58 136.86" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,133.04 L 127.58 133.04" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,129.22 L 127.58 129.22" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,125.4 L 127.58 125.4" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,121.58 L 127.58 121.58" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,117.76 L 127.58 117.76" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,113.94 L 127.58 113.94" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,110.12 L 127.58 110.12" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,106.3 L 127.58 106.3" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,102.49 L 127.58 102.49" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,98.67 L 127.58 98.67" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,94.85 L 127.58 94.85" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,91.03 L 127.58 91.03" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,87.21 L 127.58 87.21" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,83.39 L 127.58 83.39" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,79.57 L 127.58 79.57" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,75.75 L 127.58 75.75" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,71.93 L 127.58 71.93" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,68.11 L 127.58 68.11" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,64.29 L 127.58 64.29" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,60.47 L 127.58 60.47" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,56.65 L 127.58 56.65" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,52.83 L 127.58 52.83" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,49.01 L 127.58 49.01" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,45.19 L 127.58 45.19" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,41.37 L 127.58 41.37" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,37.56 L 127.58 37.56" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,33.74 L 127.58 33.74" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,29.92 L 127.58 29.92" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,26.1 L 127.58 26.1" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,22.28 L 127.58 22.28" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,18.46 L 127.58 18.46" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,14.64 L 127.58 14.64" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,10.82 L 127.58 10.82" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,7 L 127.58 7" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,3.18 L 127.58 3.18" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-0.64 L 127.58 -0.64" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-4.46 L 127.58 -4.46" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-8.28 L 127.58 -8.28" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-12.1 L 127.58 -12.1" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-15.92 L 127.58 -15.92" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-19.74 L 127.58 -19.74" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-23.56 L 127.58 -23.56" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-27.37 L 127.58 -27.37" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-31.19 L 127.58 -31.19" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-35.01 L 127.58 -35.01" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-38.83 L 127.58 -38.83" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-42.65 L 127.58 -42.65" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-46.47 L 127.58 -46.47" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-50.29 L 127.58 -50.29" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-54.11 L 127.58 -54.11" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-57.93 L 127.58 -57.93" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-61.75 L 127.58 -61.75" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-65.57 L 127.58 -65.57" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,-69.39 L 127.58 -69.39" visibility="hidden" gadfly:scale="10.0"/>
      <path fill="none" d="M19.63,159.78 L 127.58 159.78" visibility="hidden" gadfly:scale="0.5"/>
      <path fill="none" d="M19.63,83.39 L 127.58 83.39" visibility="hidden" gadfly:scale="0.5"/>
      <path fill="none" d="M19.63,7 L 127.58 7" visibility="hidden" gadfly:scale="0.5"/>
      <path fill="none" d="M19.63,-69.39 L 127.58 -69.39" visibility="hidden" gadfly:scale="0.5"/>
      <path fill="none" d="M19.63,159.78 L 127.58 159.78" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,152.14 L 127.58 152.14" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,144.5 L 127.58 144.5" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,136.86 L 127.58 136.86" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,129.22 L 127.58 129.22" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,121.58 L 127.58 121.58" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,113.94 L 127.58 113.94" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,106.3 L 127.58 106.3" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,98.67 L 127.58 98.67" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,91.03 L 127.58 91.03" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,83.39 L 127.58 83.39" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,75.75 L 127.58 75.75" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,68.11 L 127.58 68.11" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,60.47 L 127.58 60.47" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,52.83 L 127.58 52.83" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,45.19 L 127.58 45.19" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,37.56 L 127.58 37.56" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,29.92 L 127.58 29.92" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,22.28 L 127.58 22.28" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,14.64 L 127.58 14.64" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,7 L 127.58 7" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-0.64 L 127.58 -0.64" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-8.28 L 127.58 -8.28" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-15.92 L 127.58 -15.92" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-23.56 L 127.58 -23.56" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-31.19 L 127.58 -31.19" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-38.83 L 127.58 -38.83" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-46.47 L 127.58 -46.47" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-54.11 L 127.58 -54.11" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-61.75 L 127.58 -61.75" visibility="hidden" gadfly:scale="5.0"/>
      <path fill="none" d="M19.63,-69.39 L 127.58 -69.39" visibility="hidden" gadfly:scale="5.0"/>
    </g>
    <g class="guide xgridlines yfixed" stroke-dasharray="0.5,0.5" stroke-width="0.2" stroke="#D0D0E0" id="fig-0378e04b897742b597befd2e8e1c169e-element-12">
      <path fill="none" d="M42.36,5 L 42.36 85.39" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M63.16,5 L 63.16 85.39" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M83.97,5 L 83.97 85.39" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M104.78,5 L 104.78 85.39" visibility="visible" gadfly:scale="1.0"/>
      <path fill="none" d="M125.58,5 L 125.58 85.39" visibility="visible" gadfly:scale="1.0"/>
    </g>
    <g class="plotpanel" id="fig-0378e04b897742b597befd2e8e1c169e-element-13">
      <g stroke-width="0.3" fill="#000000" fill-opacity="0.000" stroke-dasharray="none" id="fig-0378e04b897742b597befd2e8e1c169e-element-14">
        <path fill="none" d="M21.63,44.35 L 21.71 44.35 21.8 43.97 21.88 43.58 21.96 44.11 22.05 44.51 22.13 44.36 22.21 43.9 22.3 44.9 22.38 44.41 22.46 44.06 22.55 43.83 22.63 44.27 22.71 44.77 22.8 44.85 22.88 44.96 22.96 44.81 23.05 45.52 23.13 45.7 23.21 45.09 23.29 45.27 23.38 45.88 23.46 46.09 23.54 46.47 23.63 45.86 23.71 45.27 23.79 45.01 23.88 44.75 23.96 44.61 24.04 44.64 24.13 44.75 24.21 44.8 24.29 45.12 24.38 44.86 24.46 45.63 24.54 45.85 24.63 46.03 24.71 45.9 24.79 45.22 24.88 45.34 24.96 45.71 25.04 45.72 25.12 45.84 25.21 46.02 25.29 45.46 25.37 45.01 25.46 44.94 25.54 45.14 25.62 45.23 25.71 44.89 25.79 45.17 25.87 45.36 25.96 45.31 26.04 45.25 26.12 44.97 26.21 45.44 26.29 45.37 26.37 45.85 26.46 45.95 26.54 45.81 26.62 46.66 26.7 46.33 26.79 46.39 26.87 46.7 26.95 47 27.04 46.99 27.12 46.75 27.2 47.2 27.29 46.74 27.37 46.01 27.45 46.22 27.54 46.23 27.62 46.67 27.7 46.96 27.79 46.84 27.87 46.54 27.95 46.97 28.04 46.9 28.12 46.23 28.2 46.41 28.28 46.65 28.37 46.71 28.45 47.14 28.53 47.66 28.62 48.11 28.7 47.59 28.78 47.41 28.87 48.41 28.95 48.13 29.03 47.9 29.12 48.09 29.2 48.17 29.28 47.97 29.37 47.57 29.45 47.14 29.53 46.76 29.62 46.61 29.7 46.62 29.78 46.66 29.86 47 29.95 47.17 30.03 47.1 30.11 46.91 30.2 46.79 30.28 46.98 30.36 46.7 30.45 47.17 30.53 47.6 30.61 47.96 30.7 47.9 30.78 48.26 30.86 47.59 30.95 48.18 31.03 48.67 31.11 48.73 31.2 49.11 31.28 48.64 31.36 48.45 31.44 48.62 31.53 47.53 31.61 47.57 31.69 47.75 31.78 47.6 31.86 48.03 31.94 48.25 32.03 47.94 32.11 47.49 32.19 47.26 32.28 47.5 32.36 46.5 32.44 46.98 32.53 47.12 32.61 47.21 32.69 46.48 32.78 46.84 32.86 46.26 32.94 46.13 33.02 46.42 33.11 46.52 33.19 46.21 33.27 46.21 33.36 46.47 33.44 46.19 33.52 46.73 33.61 46.83 33.69 46.24 33.77 46.19 33.86 46.28 33.94 45.67 34.02 45.44 34.11 45.7 34.19 46.32 34.27 46.22 34.36 46.7 34.44 46.73 34.52 46.75 34.61 46.58 34.69 46.27 34.77 46.63 34.85 46.85 34.94 46.93 35.02 46.92 35.1 47 35.19 46.9 35.27 46.81 35.35 46.38 35.44 47.28 35.52 47.49 35.6 47.21 35.69 46.68 35.77 46.22 35.85 45.89 35.94 46.62 36.02 46.71 36.1 46.25 36.19 45.79 36.27 45.61 36.35 45.49 36.43 45.45 36.52 45.22 36.6 45.45 36.68 45.56 36.77 45.35 36.85 45.08 36.93 45.64 37.02 45.59 37.1 45.77 37.18 45.88 37.27 45.71 37.35 44.95 37.43 45.23 37.52 45.42 37.6 45.06 37.68 44.87 37.77 45.13 37.85 44.41 37.93 44.61 38.01 45.13 38.1 45.39 38.18 45.93 38.26 46.27 38.35 46.88 38.43 46.68 38.51 45.82 38.6 46.26 38.68 45.97 38.76 45.97 38.85 45.64 38.93 45.95 39.01 46.29 39.1 45.72 39.18 46.31 39.26 45.95 39.35 45.72 39.43 45.87 39.51 45.51 39.59 45.51 39.68 45.49 39.76 45.57 39.84 45.61 39.93 45.53 40.01 46.08 40.09 46.51 40.18 45.96 40.26 46.28 40.34 46.4 40.43 46.12 40.51 45.8 40.59 45.74 40.68 45.45 40.76 45.93 40.84 46.22 40.93 46.32 41.01 46.46 41.09 45.84 41.17 45.23 41.26 45.09 41.34 45.12 41.42 45.05 41.51 45.48 41.59 45.05 41.67 45.39 41.76 45.67 41.84 45.79 41.92 45.99 42.01 45.7 42.09 45.7 42.17 45.71 42.26 45.71 42.34 45.44 42.42 44.85 42.51 44.85 42.59 44.54 42.67 44.57 42.75 44.59 42.84 45.09 42.92 44.44 43 44.09 43.09 43.77 43.17 44.55 43.25 44.38 43.34 44.45 43.42 45.04 43.5 44.65 43.59 45.08 43.67 45.04 43.75 45.02 43.84 44.73 43.92 45.41 44 45.24 44.09 44.6 44.17 45.05 44.25 44.61 44.34 45.01 44.42 44.65 44.5 44.89 44.58 44.8 44.67 45.17 44.75 45.64 44.83 45.89 44.92 45.89 45 45.68 45.08 45.77 45.17 46.43 45.25 46.38 45.33 46.6 45.42 45.9 45.5 45.53 45.58 45.44 45.67 45.75 45.75 45.72 45.83 45.78 45.92 45.58 46 45.73 46.08 45.69 46.16 45.63 46.25 45.53 46.33 45.83 46.41 45.85 46.5 45.79 46.58 45.49 46.66 45.56 46.75 46 46.83 46.48 46.91 46.49 47 46.63 47.08 46.43 47.16 46.54 47.25 46.97 47.33 47.27 47.41 47.58 47.5 47.65 47.58 47.87 47.66 48.16 47.74 48.78 47.83 48.95 47.91 48.39 47.99 48.37 48.08 48.32 48.16 48.12 48.24 48.85 48.33 49.35 48.41 49.21 48.49 49.42 48.58 48.52 48.66 49.01 48.74 48.52 48.83 48.47 48.91 47.96 48.99 48.08 49.08 48.4 49.16 48.76 49.24 48.42 49.32 48.75 49.41 48.45 49.49 48.66 49.57 48.62 49.66 48.91 49.74 48.76 49.82 48.94 49.91 48.73 49.99 48.62 50.07 49.01 50.16 49 50.24 48.91 50.32 48.95 50.41 49.04 50.49 48.95 50.57 49.49 50.66 49.26 50.74 49.56 50.82 49.17 50.9 49.77 50.99 49.54 51.07 49.74 51.15 49.59 51.24 50.18 51.32 49.54 51.4 49.89 51.49 50.23 51.57 50.59 51.65 50.41 51.74 50.4 51.82 50.51 51.9 50.73 51.99 50.74 52.07 50.04 52.15 49.85 52.24 49.84 52.32 49.95 52.4 50.05 52.48 50.22 52.57 49.87 52.65 49.73 52.73 49.64 52.82 49.88 52.9 50.1 52.98 49.98 53.07 49.75 53.15 49.79 53.23 49.63 53.32 49.92 53.4 50.09 53.48 50.2 53.57 49.98 53.65 50.25 53.73 50.58 53.82 50.69 53.9 50.32 53.98 50.63 54.07 50.94 54.15 50.59 54.23 49.84 54.31 50.17 54.4 49.78 54.48 49.69 54.56 49.39 54.65 49.71 54.73 50.15 54.81 50.1 54.9 49.38 54.98 49.06 55.06 48.86 55.15 48.22 55.23 47.92 55.31 48.48 55.4 48.24 55.48 47.92 55.56 48.48 55.65 49.12 55.73 49 55.81 48.94 55.89 49.34 55.98 49.5 56.06 49.21 56.14 49.49 56.23 49.39 56.31 49.13 56.39 49.77 56.48 49.82 56.56 50.16 56.64 50.32 56.73 50.13 56.81 50.06 56.89 50.43 56.98 50.69 57.06 50.37 57.14 50.35 57.23 50.6 57.31 50.4 57.39 49.85 57.47 50.42 57.56 50.17 57.64 49.95 57.72 49.72 57.81 49.37 57.89 49.4 57.97 49.37 58.06 49.95 58.14 50.15 58.22 50.35 58.31 51.12 58.39 51.29 58.47 51.56 58.56 51.37 58.64 51.11 58.72 50.8 58.81 50.97 58.89 51.2 58.97 50.56 59.05 50.28 59.14 50.07 59.22 49.53 59.3 49.68 59.39 50.13 59.47 50.17 59.55 50.38 59.64 50.03 59.72 49.93 59.8 50.02 59.89 50.15 59.97 49.8 60.05 49.87 60.14 50.34 60.22 50.55 60.3 50.15 60.39 49.7 60.47 50.15 60.55 50.01 60.63 50.09 60.72 50.42 60.8 51.05 60.88 50.65 60.97 50.54 61.05 50.34 61.13 49.99 61.22 50.81 61.3 51.28 61.38 51.43 61.47 51.12 61.55 51.82 61.63 52.12 61.72 52.25 61.8 52.34 61.88 52.54 61.97 52.69 62.05 52.91 62.13 52.61 62.21 52.6 62.3 52.67 62.38 52.36 62.46 52.21 62.55 52.63 62.63 52.54 62.71 52.41 62.8 52.17 62.88 52.73 62.96 53.01 63.05 53.27 63.13 53.62 63.21 53.69 63.3 53.69 63.38 53.32 63.46 53.6 63.55 53.62 63.63 53.23 63.71 53.61 63.8 53.73 63.88 53.44 63.96 54.18 64.04 54.35 64.13 54.46 64.21 54.29 64.29 54.8 64.38 54.88 64.46 55.14 64.54 55.43 64.63 55.47 64.71 55.06 64.79 55.34 64.88 55.48 64.96 55.26 65.04 55.73 65.13 56.1 65.21 55.81 65.29 55.75 65.38 55.87 65.46 56.23 65.54 56.05 65.62 55.99 65.71 56.05 65.79 55.82 65.87 56.1 65.96 55.77 66.04 55.79 66.12 55.55 66.21 54.92 66.29 55.03 66.37 54.91 66.46 54.69 66.54 54.71 66.62 55.09 66.71 54.68 66.79 54.89 66.87 55.12 66.96 54.85 67.04 54.78 67.12 55.03 67.2 55.32 67.29 55.12 67.37 55.3 67.45 55.21 67.54 55.22 67.62 55.36 67.7 55.66 67.79 55.88 67.87 55.92 67.95 55.77 68.04 55.67 68.12 55.65 68.2 55.65 68.29 55.41 68.37 55.42 68.45 55.01 68.54 55.29 68.62 55.31 68.7 55.4 68.78 55.81 68.87 56.29 68.95 56.11 69.03 56.03 69.12 55.6 69.2 55.84 69.28 55.43 69.37 54.98 69.45 54.98 69.53 55.33 69.62 55.69 69.7 55.65 69.78 55.68 69.87 55.45 69.95 55.4 70.03 55.17 70.12 55.66 70.2 55.63 70.28 55.92 70.36 56.08 70.45 55.94 70.53 55.77 70.61 55.74 70.7 55.89 70.78 56.47 70.86 56.51 70.95 56.24 71.03 56.82 71.11 56.66 71.2 56.55 71.28 56.54 71.36 56.58 71.45 56.56 71.53 56.57 71.61 56.9 71.7 57.15 71.78 56.81 71.86 57.03 71.94 56.92 72.03 57.29 72.11 57.37 72.19 57.63 72.28 57.76 72.36 57.79 72.44 57.66 72.53 57.32 72.61 57.06 72.69 57.18 72.78 57.72 72.86 57.78 72.94 57.45 73.03 58.11 73.11 57.56 73.19 57.32 73.28 57.47 73.36 57.34 73.44 57.7 73.53 57.55 73.61 57.79 73.69 57.91 73.77 57.79 73.86 57.71 73.94 58.01 74.02 57.94 74.11 58.06 74.19 58.03 74.27 58.19 74.36 57.99 74.44 58.36 74.52 58.65 74.61 58.83 74.69 59.07 74.77 59.17 74.86 59.1 74.94 59.49 75.02 59.24 75.11 59.13 75.19 59.08 75.27 59.15 75.35 59.1 75.44 59.55 75.52 59.66 75.6 60.06 75.69 60.29 75.77 60.69 75.85 60.69 75.94 60.9 76.02 60.93 76.1 60.91 76.19 61.16 76.27 61.59 76.35 61.78 76.44 61.55 76.52 61.76 76.6 61.53 76.69 61.46 76.77 61.71 76.85 61.26 76.93 60.83 77.02 60.85 77.1 60.86 77.18 61.12 77.27 61.33 77.35 61.46 77.43 61.45 77.52 61.59 77.6 61.87 77.68 61.74 77.77 61.99 77.85 62.02 77.93 62.44 78.02 62.41 78.1 62.4 78.18 62.18 78.27 61.81 78.35 61.83 78.43 61.71 78.51 61.35 78.6 61.5 78.68 61.5 78.76 61.58 78.85 61.59 78.93 61.39 79.01 61.2 79.1 61.43 79.18 61.63 79.26 61.71 79.35 61.71 79.43 61.67 79.51 61.68 79.6 61.59 79.68 61.17 79.76 61.06 79.85 60.75 79.93 60.56 80.01 60.44 80.09 60.57 80.18 60.65 80.26 60.74 80.34 60.61 80.43 60.6 80.51 60.58 80.59 60.6 80.68 60.87 80.76 60.59 80.84 60.41 80.93 60.36 81.01 60.51 81.09 60.45 81.18 60.61 81.26 60.49 81.34 60.25 81.43 60.64 81.51 60.25 81.59 60.29 81.67 60.06 81.76 60.04 81.84 60.24 81.92 60.09 82.01 60.52 82.09 60.57 82.17 60.88 82.26 60.82 82.34 60.95 82.42 60.98 82.51 61.19 82.59 61.22 82.67 61.27 82.76 61.54 82.84 61.5 82.92 62.02 83.01 62.11 83.09 62.01 83.17 62.04 83.26 62.14 83.34 61.94 83.42 62.12 83.5 62.23 83.59 62.14 83.67 62.15 83.75 61.99 83.84 62.04 83.92 61.93 84 61.84 84.09 61.84 84.17 61.59 84.25 61.58 84.34 61.6 84.42 61.53 84.5 61.37 84.59 61.46 84.67 61.15 84.75 61.14 84.84 61.2 84.92 60.87 85 61.12 85.08 61.09 85.17 60.74 85.25 60.58 85.33 60.89 85.42 60.99 85.5 61.05 85.58 60.67 85.67 60.74 85.75 60.51 85.83 60.2 85.92 60.55 86 60.1 86.08 60.14 86.17 60.11 86.25 59.92 86.33 59.88 86.42 59.74 86.5 59.76 86.58 59.79 86.66 59.71 86.75 59.6 86.83 59.64 86.91 59.66 87 59.88 87.08 59.8 87.16 59.63 87.25 59.91 87.33 59.74 87.41 59.96 87.5 60.19 87.58 60.24 87.66 60.39 87.75 60.37 87.83 60.56 87.91 60.48 88 60.85 88.08 60.73 88.16 60.37 88.24 60.2 88.33 60.71 88.41 60.87 88.49 60.99 88.58 60.99 88.66 60.83 88.74 60.61 88.83 60.72 88.91 60.79 88.99 60.71 89.08 60.9 89.16 61 89.24 61.03 89.33 60.95 89.41 60.93 89.49 60.75 89.58 60.8 89.66 60.86 89.74 60.6 89.82 60.35 89.91 60.06 89.99 60.25 90.07 60.84 90.16 60.6 90.24 60.64 90.32 60.33 90.41 60.62 90.49 60.76 90.57 60.62 90.66 60.77 90.74 60.51 90.82 60.6 90.91 60.7 90.99 60.63 91.07 60.45 91.16 60.68 91.24 61.03 91.32 61.17 91.4 61.14 91.49 60.76 91.57 60.75 91.65 61.04 91.74 60.63 91.82 60.6 91.9 60.79 91.99 60.84 92.07 61.06 92.15 60.99 92.24 60.99 92.32 61.02 92.4 61.31 92.49 61.25 92.57 61.39 92.65 61.22 92.74 60.98 92.82 61.17 92.9 61.21 92.99 61.16 93.07 61.19 93.15 61.27 93.23 61.52 93.32 61.23 93.4 61.15 93.48 61.16 93.57 61.55 93.65 61.64 93.73 61.5 93.82 61.28 93.9 61.35 93.98 61.28 94.07 61.15 94.15 61.23 94.23 61.56 94.32 61.28 94.4 61.25 94.48 61.39 94.57 61.22 94.65 61.14 94.73 61.39 94.81 61.5 94.9 61.42 94.98 61.25 95.06 60.95 95.15 61.06 95.23 60.93 95.31 60.92 95.4 61.05 95.48 60.9 95.56 60.57 95.65 60.1 95.73 59.62 95.81 59.72 95.9 59.85 95.98 59.93 96.06 60.07 96.15 60.14 96.23 60.32 96.31 60.4 96.39 60.54 96.48 60.69 96.56 60.76 96.64 61.17 96.73 61.2 96.81 61.41 96.89 61.5 96.98 61.69 97.06 61.51 97.14 61.5 97.23 61.65 97.31 61.74 97.39 61.47 97.48 61.73 97.56 61.64 97.64 61.29 97.73 61.85 97.81 61.98 97.89 62.33 97.97 62.12 98.06 62.21 98.14 61.92 98.22 62.26 98.31 62.04 98.39 61.79 98.47 61.7 98.56 61.42 98.64 61.23 98.72 61.04 98.81 61.24 98.89 61.53 98.97 61.29 99.06 61.11 99.14 61.12 99.22 60.81 99.31 61.14 99.39 61.31 99.47 61.38 99.55 60.9 99.64 61.02 99.72 60.64 99.8 60.71 99.89 60.66 99.97 60.46 100.05 60.79 100.14 60.81 100.22 60.43 100.3 60.53 100.39 60.63 100.47 61.06 100.55 60.98 100.64 60.73 100.72 60.43 100.8 60.67 100.89 60.52 100.97 60.74 101.05 60.59 101.13 60.37 101.22 60.33 101.3 60.02 101.38 59.79 101.47 59.67 101.55 59.6 101.63 59.57 101.72 59.2 101.8 59.35 101.88 59.26 101.97 59.17 102.05 59.1 102.13 59.76 102.22 59.97 102.3 60.2 102.38 59.94 102.47 59.79 102.55 59.81 102.63 59.96 102.72 59.93 102.8 60.24 102.88 59.79 102.96 59.5 103.05 59.82 103.13 59.71 103.21 59.38 103.3 59.55 103.38 59.31 103.46 58.44 103.55 58.32 103.63 57.92 103.71 58.29 103.8 58.49 103.88 58.4 103.96 58.08 104.05 58.17 104.13 58.51 104.21 58.27 104.3 58.54 104.38 58.16 104.46 58.38 104.54 58.51 104.63 58.58 104.71 58.46 104.79 58.09 104.88 58.09 104.96 57.7 105.04 57.43 105.13 57.61 105.21 57.36 105.29 57.55 105.38 57.27 105.46 57.46 105.54 57.67 105.63 57.61 105.71 57.6 105.79 57.05 105.88 57.09 105.96 57.35 106.04 57.34 106.12 57.5 106.21 57.6 106.29 57.29 106.37 57.14 106.46 57.56 106.54 57.32 106.62 57.2 106.71 57 106.79 56.59 106.87 56.81 106.96 56.27 107.04 56.2 107.12 56.64 107.21 56.64 107.29 56.69 107.37 56.77 107.46 56.25 107.54 56.28 107.62 56.13 107.7 56.03 107.79 55.85 107.87 55.51 107.95 55.35 108.04 55.06 108.12 55.27 108.2 55.28 108.29 54.94 108.37 54.48 108.45 54.41 108.54 53.92 108.62 54 108.7 54.41 108.79 54.67 108.87 54.35 108.95 54.36 109.04 54.37 109.12 54.18 109.2 54.49 109.28 54.84 109.37 54.66 109.45 54.99 109.53 55.02 109.62 55.39 109.7 55.41 109.78 56.03 109.87 56.07 109.95 56.03 110.03 56.13 110.12 55.86 110.2 55.26 110.28 55.27 110.37 55.07 110.45 54.62 110.53 54.77 110.62 54.91 110.7 55.02 110.78 55.1 110.86 55.14 110.95 55.64 111.03 55.3 111.11 55.01 111.2 54.88 111.28 55 111.36 55.31 111.45 55.35 111.53 55.47 111.61 55.88 111.7 55.73 111.78 55.77 111.86 55.96 111.95 56.17 112.03 55.96 112.11 56.41 112.2 56.03 112.28 55.81 112.36 55.28 112.45 55.76 112.53 56.06 112.61 56.16 112.69 56.09 112.78 56.29 112.86 56.26 112.94 56.13 113.03 56.08 113.11 56.07 113.19 56.01 113.28 55.97 113.36 56.47 113.44 56.67 113.53 56.78 113.61 56.98 113.69 56.93 113.78 56.94 113.86 57.2 113.94 57 114.03 57.2 114.11 57.77 114.19 58.01 114.27 58.13 114.36 57.78 114.44 57.56 114.52 57.5 114.61 58.07 114.69 57.83 114.77 57.88 114.86 57.42 114.94 57.43 115.02 57.69 115.11 57.4 115.19 57.12 115.27 56.72 115.36 56.33 115.44 56.84 115.52 56.7 115.61 56.24 115.69 56.02 115.77 55.97 115.85 55.91 115.94 55.66 116.02 55.49 116.1 55.56 116.19 55.74 116.27 55.53 116.35 55.62 116.44 55.57 116.52 55.5 116.6 55.46 116.69 55.23 116.77 55.72 116.85 55.54 116.94 55.83 117.02 56.07 117.1 55.99 117.19 55.7 117.27 55.82 117.35 55.8 117.43 55.87 117.52 56.05 117.6 56.35 117.68 56.46 117.77 56.08 117.85 56.27 117.93 56.79 118.02 56.87 118.1 57 118.18 56.77 118.27 56.7 118.35 56.77 118.43 56.4 118.52 56.2 118.6 56.02 118.68 56.1 118.77 56.17 118.85 56.23 118.93 56.16 119.01 56.53 119.1 56.65 119.18 57 119.26 57.27 119.35 57.4 119.43 57.52 119.51 57.72 119.6 57.62 119.68 57.31 119.76 57 119.85 57.33 119.93 57.16 120.01 57.13 120.1 56.81 120.18 56.92 120.26 56.77 120.35 56.48 120.43 56.14 120.51 56.23 120.59 55.89 120.68 55.94 120.76 56.22 120.84 56.42 120.93 56.75 121.01 56.56 121.09 56.66 121.18 56.6 121.26 56.71 121.34 56.54 121.43 56.67 121.51 57.05 121.59 56.91 121.68 56.59 121.76 56.18 121.84 56.04 121.93 56.22 122.01 55.95 122.09 55.8 122.18 55.66 122.26 55.75 122.34 55.87 122.42 55.9 122.51 55.94 122.59 56.12 122.67 55.9 122.76 55.87 122.84 55.87 122.92 55.54 123.01 55.7 123.09 55.98 123.17 55.96 123.26 55.37 123.34 55.75 123.42 55.57 123.51 55.62 123.59 55.76 123.67 55.33 123.76 54.85 123.84 54.95 123.92 55.16 124 55.23 124.09 55.27 124.17 54.93 124.25 54.79 124.34 54.71 124.42 54.56 124.5 54.32 124.59 54.57 124.67 54.27 124.75 53.94 124.84 53.77 124.92 54.14 125 54.45 125.09 54.65 125.17 54.54 125.25 54 125.34 54.46 125.42 53.95 125.5 54.29 125.58 54.27" class="geometry color_" stroke="#004D84"/>
        <path fill="none" d="M21.63,44.35 L 21.71 44.35 21.8 44.74 21.88 45.14 21.96 45.24 22.05 45.18 22.13 45.09 22.21 45.31 22.3 45.29 22.38 45.45 22.46 45.57 22.55 45.4 22.63 45.56 22.71 45.7 22.8 45.07 22.88 45.15 22.96 45.06 23.05 44.89 23.13 44.84 23.21 44.6 23.29 43.86 23.38 43.07 23.46 43.2 23.54 43.5 23.63 43.42 23.71 44.02 23.79 43.97 23.88 44.62 23.96 43.89 24.04 43.92 24.13 44.59 24.21 44.17 24.29 43.44 24.38 43.63 24.46 43.78 24.54 43.49 24.63 43.6 24.71 43.76 24.79 43.74 24.88 44.13 24.96 44.19 25.04 44.45 25.12 44.49 25.21 44.45 25.29 44.08 25.37 44.61 25.46 44.05 25.54 43.42 25.62 43.22 25.71 43.61 25.79 43.03 25.87 42.75 25.96 42.35 26.04 42.88 26.12 43.25 26.21 43.25 26.29 43.77 26.37 43.71 26.46 43.6 26.54 43.91 26.62 44.39 26.7 44.51 26.79 44.27 26.87 44.41 26.95 44.8 27.04 44.86 27.12 44.75 27.2 44.27 27.29 44.2 27.37 44.31 27.45 44.4 27.54 44.62 27.62 44.4 27.7 44.86 27.79 44.88 27.87 45.08 27.95 45.08 28.04 44.59 28.12 44.93 28.2 45.15 28.28 45.06 28.37 44.52 28.45 44.23 28.53 43.64 28.62 44.31 28.7 44.34 28.78 44.23 28.87 44.38 28.95 43.88 29.03 43.87 29.12 43.53 29.2 43.46 29.28 43.51 29.37 42.7 29.45 43.12 29.53 43.13 29.62 42.93 29.7 43.07 29.78 42.84 29.86 43.1 29.95 42.46 30.03 42.56 30.11 44.06 30.2 43.74 30.28 43.1 30.36 43.03 30.45 43.71 30.53 44.1 30.61 43.78 30.7 43.42 30.78 43.56 30.86 43.74 30.95 43.66 31.03 43.83 31.11 44.76 31.2 45.03 31.28 45.06 31.36 45.03 31.44 45.53 31.53 46.22 31.61 46.72 31.69 46.7 31.78 46.95 31.86 46.89 31.94 46.96 32.03 47.78 32.11 47.52 32.19 47.81 32.28 48.77 32.36 49.04 32.44 49.48 32.53 48.95 32.61 49.13 32.69 49.15 32.78 49.28 32.86 48.56 32.94 48.3 33.02 48.35 33.11 48.41 33.19 48.14 33.27 48.04 33.36 48.31 33.44 48.4 33.52 48.55 33.61 48.49 33.69 49.32 33.77 49.33 33.86 49.01 33.94 49.42 34.02 50.03 34.11 50.43 34.19 51.11 34.27 51.2 34.36 51.23 34.44 51.28 34.52 51.24 34.61 50.93 34.69 50.93 34.77 50.84 34.85 50.33 34.94 49.71 35.02 49.75 35.1 48.82 35.19 48.67 35.27 48.22 35.35 48.13 35.44 48.05 35.52 48.1 35.6 47.92 35.69 48 35.77 48.4 35.85 48.39 35.94 48.48 36.02 48.58 36.1 48.8 36.19 48.6 36.27 49.54 36.35 49.73 36.43 49.4 36.52 49.39 36.6 49.74 36.68 49.69 36.77 49.46 36.85 49.73 36.93 49.53 37.02 50.27 37.1 50.09 37.18 50.45 37.27 50.05 37.35 50.63 37.43 50.97 37.52 50.89 37.6 50.42 37.68 49.71 37.77 50.37 37.85 50.23 37.93 49.71 38.01 49.88 38.1 50.1 38.18 49.88 38.26 50.3 38.35 50.03 38.43 49.98 38.51 49.56 38.6 49.24 38.68 49.2 38.76 49.54 38.85 49.69 38.93 49.32 39.01 48.83 39.1 48.57 39.18 48.69 39.26 48.58 39.35 48.58 39.43 48.74 39.51 48.57 39.59 48.94 39.68 49.11 39.76 49.59 39.84 49.84 39.93 49.62 40.01 50.19 40.09 50 40.18 49.79 40.26 50.15 40.34 50.38 40.43 50.2 40.51 50.19 40.59 50.44 40.68 50.76 40.76 50.74 40.84 50.68 40.93 51.22 41.01 50.92 41.09 50.85 41.17 51.06 41.26 50.84 41.34 51.05 41.42 51.6 41.51 51.73 41.59 52.09 41.67 52.48 41.76 51.83 41.84 52.3 41.92 52.12 42.01 52.26 42.09 52.55 42.17 52.65 42.26 52.49 42.34 52.36 42.42 52.47 42.51 52.47 42.59 51.99 42.67 52.25 42.75 52.2 42.84 51.74 42.92 51.4 43 51.19 43.09 51.35 43.17 51.4 43.25 51.24 43.34 50.99 43.42 51.3 43.5 51.34 43.59 51.58 43.67 51.71 43.75 51.7 43.84 52.02 43.92 52.23 44 51.95 44.09 52.16 44.17 52.09 44.25 51.82 44.34 52.01 44.42 52.29 44.5 52.68 44.58 52.53 44.67 52.5 44.75 52.9 44.83 52.83 44.92 52.74 45 53.01 45.08 53 45.17 52.94 45.25 52.9 45.33 53.14 45.42 53.22 45.5 53.46 45.58 53.13 45.67 53.67 45.75 53.85 45.83 53.91 45.92 54.31 46 54.61 46.08 54.34 46.16 54.17 46.25 53.76 46.33 53.75 46.41 53.61 46.5 53.75 46.58 53.34 46.66 53.68 46.75 53.83 46.83 54.2 46.91 54.54 47 54.62 47.08 54.59 47.16 54.77 47.25 54.62 47.33 54.13 47.41 53.95 47.5 53.9 47.58 53.83 47.66 53.64 47.74 53.84 47.83 53.57 47.91 53.85 47.99 54.17 48.08 54.07 48.16 54.55 48.24 54.36 48.33 53.92 48.41 53.72 48.49 53.8 48.58 54.28 48.66 53.67 48.74 53.8 48.83 53.77 48.91 54.05 48.99 54.09 49.08 54.08 49.16 54.36 49.24 54.58 49.32 54.74 49.41 54.72 49.49 54.45 49.57 54.36 49.66 54.36 49.74 54.61 49.82 54.37 49.91 54.21 49.99 54.12 50.07 54.26 50.16 54.36 50.24 54.28 50.32 54.21 50.41 54.77 50.49 55.17 50.57 54.9 50.66 55.22 50.74 54.64 50.82 54.81 50.9 55.06 50.99 55.46 51.07 55.28 51.15 55.19 51.24 55.34 51.32 55.22 51.4 54.68 51.49 54.23 51.57 54.1 51.65 54.26 51.74 54.27 51.82 54.13 51.9 54.15 51.99 53.95 52.07 54.39 52.15 54.14 52.24 54.32 52.32 54.32 52.4 54.38 52.48 53.85 52.57 53.86 52.65 54.17 52.73 54.52 52.82 54.42 52.9 54.45 52.98 54.66 53.07 54.49 53.15 54.64 53.23 54.95 53.32 55.09 53.4 55.16 53.48 55.28 53.57 55.43 53.65 54.87 53.73 54.74 53.82 54.75 53.9 54.76 53.98 54.88 54.07 54.75 54.15 54.17 54.23 54.07 54.31 54.7 54.4 54.57 54.48 54.33 54.56 55.14 54.65 55.61 54.73 56.13 54.81 55.8 54.9 55.61 54.98 55.7 55.06 55.48 55.15 55.58 55.23 55.9 55.31 55.84 55.4 55.37 55.48 55.2 55.56 55.57 55.65 55.77 55.73 55.7 55.81 55.69 55.89 55.65 55.98 55.64 56.06 55.79 56.14 55.64 56.23 55.22 56.31 55.2 56.39 55.35 56.48 55.3 56.56 55.1 56.64 55.37 56.73 55.28 56.81 55.83 56.89 55.86 56.98 55.61 57.06 55.88 57.14 55.92 57.23 55.85 57.31 55.94 57.39 56.25 57.47 56.26 57.56 56.36 57.64 56.21 57.72 56.07 57.81 56.47 57.89 56.26 57.97 56.01 58.06 55.82 58.14 55.47 58.22 54.89 58.31 55.22 58.39 55.18 58.47 55.01 58.56 54.97 58.64 55.01 58.72 55 58.81 55 58.89 54.48 58.97 54.6 59.05 54.28 59.14 53.95 59.22 53.88 59.3 53.94 59.39 54.17 59.47 53.76 59.55 53.2 59.64 53.37 59.72 53.48 59.8 53.51 59.89 53.67 59.97 53.87 60.05 53.62 60.14 53.41 60.22 53.37 60.3 53.4 60.39 53.59 60.47 53.43 60.55 53.35 60.63 53.71 60.72 53.6 60.8 53.73 60.88 53.96 60.97 54.11 61.05 54.66 61.13 54.38 61.22 53.87 61.3 54.23 61.38 54.23 61.47 54.09 61.55 53.58 61.63 52.99 61.72 52.86 61.8 52.72 61.88 52.73 61.97 52.99 62.05 52.9 62.13 52.68 62.21 52.86 62.3 53.21 62.38 53.48 62.46 52.84 62.55 53.13 62.63 53.17 62.71 53.5 62.8 53.36 62.88 53.46 62.96 53.26 63.05 52.92 63.13 52.65 63.21 52.45 63.3 52.45 63.38 52.77 63.46 53.09 63.55 53.33 63.63 53.4 63.71 52.72 63.8 52.94 63.88 52.88 63.96 53.16 64.04 53.08 64.13 53.27 64.21 52.74 64.29 52.45 64.38 52.02 64.46 51.71 64.54 51.78 64.63 51.46 64.71 51.64 64.79 51.36 64.88 51.34 64.96 51.03 65.04 50.79 65.13 50.75 65.21 50.72 65.29 50.93 65.38 50.81 65.46 51.19 65.54 50.86 65.62 50.53 65.71 50.71 65.79 50.52 65.87 50.62 65.96 50.15 66.04 49.93 66.12 50.49 66.21 50.86 66.29 50.25 66.37 50.51 66.46 50.28 66.54 50.74 66.62 50.58 66.71 50.41 66.79 50.39 66.87 50.66 66.96 50.68 67.04 50.4 67.12 50.75 67.2 50.24 67.29 50.52 67.37 50.63 67.45 50.65 67.54 51.07 67.62 51.1 67.7 51.18 67.79 51.19 67.87 50.93 67.95 51.14 68.04 51.4 68.12 51.18 68.2 50.72 68.29 50.35 68.37 49.82 68.45 49.79 68.54 50 68.62 50.07 68.7 50.31 68.78 50.66 68.87 51.08 68.95 51.17 69.03 51.56 69.12 51.53 69.2 51.77 69.28 51.88 69.37 52.17 69.45 52.4 69.53 52.07 69.62 52.53 69.7 52.54 69.78 51.94 69.87 51.99 69.95 51.95 70.03 52.06 70.12 52.34 70.2 52.67 70.28 52.91 70.36 52.86 70.45 53.3 70.53 53.65 70.61 53.54 70.7 53.74 70.78 53.41 70.86 53.18 70.95 53.18 71.03 52.96 71.11 52.7 71.2 52.6 71.28 52.56 71.36 52.69 71.45 52.79 71.53 52.71 71.61 52.78 71.7 52.81 71.78 52.59 71.86 52.61 71.94 52.26 72.03 52.16 72.11 52.29 72.19 52.26 72.28 51.56 72.36 52.43 72.44 52.62 72.53 52.03 72.61 51.82 72.69 51.99 72.78 52.34 72.86 52.01 72.94 51.78 73.03 51.67 73.11 51.54 73.19 51.52 73.28 51.58 73.36 51.72 73.44 51.76 73.53 51.78 73.61 52.05 73.69 52.47 73.77 52.41 73.86 52.77 73.94 52.35 74.02 52.23 74.11 52.26 74.19 52.49 74.27 52.58 74.36 52.51 74.44 52.6 74.52 52.9 74.61 53.25 74.69 52.96 74.77 53.3 74.86 53.38 74.94 53.53 75.02 53.55 75.11 53.42 75.19 53.38 75.27 53.26 75.35 53.41 75.44 53.76 75.52 53.96 75.6 53.92 75.69 53.65 75.77 53.73 75.85 53.61 75.94 54.28 76.02 54.59 76.1 54.77 76.19 54.54 76.27 54.56 76.35 54.94 76.44 55.15 76.52 55.53 76.6 55.45 76.69 55.48 76.77 55.29 76.85 55.23 76.93 55.37 77.02 55.21 77.1 55.13 77.18 55.35 77.27 55.13 77.35 54.82 77.43 54.99 77.52 54.93 77.6 54.82 77.68 54.84 77.77 54.83 77.85 54.59 77.93 54.49 78.02 54.49 78.1 54.95 78.18 54.93 78.27 55.07 78.35 54.53 78.43 55.06 78.51 55.34 78.6 55.44 78.68 55.29 78.76 55.23 78.85 55.15 78.93 54.98 79.01 54.86 79.1 55.09 79.18 55.4 79.26 55.17 79.35 55.37 79.43 55.67 79.51 56 79.6 56.62 79.68 56.58 79.76 56.69 79.85 56.43 79.93 56.45 80.01 56.45 80.09 56.43 80.18 56.64 80.26 56.83 80.34 56.56 80.43 56.75 80.51 56.55 80.59 56.39 80.68 56.17 80.76 56.37 80.84 56.33 80.93 56.53 81.01 56.66 81.09 56.79 81.18 56.64 81.26 56.28 81.34 56.66 81.43 56.87 81.51 56.76 81.59 56.72 81.67 56.8 81.76 56.86 81.84 57.25 81.92 57.23 82.01 57.13 82.09 57.45 82.17 57.87 82.26 58.31 82.34 58.16 82.42 58.27 82.51 58.13 82.59 58.12 82.67 58.39 82.76 58.72 82.84 58.99 82.92 59.09 83.01 58.98 83.09 58.63 83.17 58.78 83.26 58.77 83.34 58.53 83.42 58.63 83.5 58.85 83.59 59.23 83.67 59.07 83.75 59.01 83.84 59.24 83.92 59.16 84 59.03 84.09 59.03 84.17 59.01 84.25 59.08 84.34 58.79 84.42 58.71 84.5 59.02 84.59 59.03 84.67 59.09 84.75 59.66 84.84 59.58 84.92 59.78 85 59.54 85.08 59.56 85.17 59.41 85.25 59.88 85.33 59.78 85.42 60.08 85.5 60.14 85.58 60.59 85.67 60.9 85.75 60.98 85.83 60.94 85.92 61.49 86 61.2 86.08 61.37 86.17 61.5 86.25 61.79 86.33 61.83 86.42 61.61 86.5 61.68 86.58 61.87 86.66 61.85 86.75 61.99 86.83 62.09 86.91 62.06 87 61.88 87.08 61.55 87.16 61.64 87.25 61.49 87.33 61.42 87.41 61.9 87.5 61.53 87.58 61.58 87.66 61.56 87.75 61.39 87.83 61.2 87.91 61.27 88 61.13 88.08 60.91 88.16 60.59 88.24 60.64 88.33 60.43 88.41 60.55 88.49 60.83 88.58 60.78 88.66 60.47 88.74 60.74 88.83 60.97 88.91 61.23 88.99 61.22 89.08 61.15 89.16 61.06 89.24 61.39 89.33 61.57 89.41 61.54 89.49 61.42 89.58 61.45 89.66 61.4 89.74 61.41 89.82 61.85 89.91 62.35 89.99 62.47 90.07 62.31 90.16 62.16 90.24 61.99 90.32 61.98 90.41 62.11 90.49 62.25 90.57 61.8 90.66 61.75 90.74 61.95 90.82 62.31 90.91 62.41 90.99 62.62 91.07 62.56 91.16 62.68 91.24 62.67 91.32 62.58 91.4 62.75 91.49 62.86 91.57 62.71 91.65 62.61 91.74 62.5 91.82 62.33 91.9 62.35 91.99 62.03 92.07 61.94 92.15 62.04 92.24 62.15 92.32 62.21 92.4 62.48 92.49 62.54 92.57 62.67 92.65 62.69 92.74 62.44 92.82 62.56 92.9 63.03 92.99 62.62 93.07 62.54 93.15 62.79 93.23 63.24 93.32 62.92 93.4 62.68 93.48 62.62 93.57 62.63 93.65 62.44 93.73 62.48 93.82 62.82 93.9 62.85 93.98 62.47 94.07 62.66 94.15 62.16 94.23 61.74 94.32 61.93 94.4 61.77 94.48 61.62 94.57 61.71 94.65 61.8 94.73 61.89 94.81 61.77 94.9 61.8 94.98 61.5 95.06 61.33 95.15 61.31 95.23 60.77 95.31 61.21 95.4 61.03 95.48 60.95 95.56 60.9 95.65 60.64 95.73 60.34 95.81 60.35 95.9 60.43 95.98 60.24 96.06 60.12 96.15 59.71 96.23 59.94 96.31 60.31 96.39 60.33 96.48 60.46 96.56 60.86 96.64 60.63 96.73 60.74 96.81 60.47 96.89 60.61 96.98 60.6 97.06 60.83 97.14 60.88 97.23 60.67 97.31 60.72 97.39 60.55 97.48 60.74 97.56 60.58 97.64 60 97.73 60.24 97.81 60.1 97.89 60.07 97.97 59.84 98.06 59.62 98.14 59.76 98.22 59.82 98.31 60.51 98.39 60.04 98.47 60.19 98.56 60.03 98.64 60.13 98.72 60.05 98.81 60.13 98.89 60.53 98.97 60.25 99.06 60.12 99.14 60.26 99.22 60.62 99.31 60.71 99.39 60.85 99.47 60.57 99.55 60.83 99.64 60.85 99.72 61.36 99.8 61.56 99.89 61.79 99.97 61.96 100.05 61.91 100.14 61.99 100.22 61.84 100.3 62.19 100.39 62.19 100.47 62.26 100.55 62.58 100.64 62.68 100.72 62.76 100.8 62.88 100.89 62.77 100.97 62.5 101.05 62.36 101.13 62.02 101.22 62.3 101.3 62.48 101.38 62.43 101.47 62.3 101.55 62.36 101.63 62.25 101.72 62.47 101.8 62.18 101.88 62.33 101.97 62.71 102.05 62.89 102.13 62.82 102.22 62.61 102.3 62.45 102.38 62.39 102.47 62.91 102.55 62.56 102.63 62.27 102.72 62.26 102.8 62.04 102.88 62.13 102.96 62.04 103.05 62.05 103.13 62.09 103.21 62.06 103.3 61.98 103.38 62.37 103.46 62.58 103.55 62.48 103.63 62.33 103.71 62.46 103.8 62.74 103.88 62.47 103.96 62.29 104.05 62.22 104.13 62.12 104.21 62.27 104.3 62.35 104.38 62.3 104.46 62.55 104.54 62.62 104.63 62.74 104.71 62.56 104.79 62.26 104.88 62.26 104.96 61.79 105.04 61.68 105.13 62.06 105.21 61.99 105.29 61.92 105.38 61.8 105.46 61.56 105.54 61.27 105.63 61.28 105.71 61.58 105.79 61.88 105.88 62.05 105.96 62.05 106.04 62.12 106.12 62.3 106.21 62.05 106.29 61.92 106.37 61.96 106.46 62.15 106.54 62.38 106.62 62.67 106.71 62.81 106.79 62.58 106.87 62.67 106.96 62.76 107.04 62.76 107.12 62.45 107.21 62.89 107.29 62.78 107.37 62.67 107.46 62.6 107.54 62.55 107.62 62.29 107.7 62.39 107.79 62.41 107.87 62.64 107.95 62.54 108.04 62.53 108.12 62.65 108.2 62.59 108.29 62.25 108.37 62.19 108.45 62.12 108.54 61.86 108.62 62.03 108.7 62.2 108.79 62.26 108.87 62.08 108.95 62.13 109.04 62.21 109.12 62.33 109.2 62.36 109.28 62.14 109.37 62.53 109.45 62.71 109.53 62.81 109.62 62.71 109.7 62.84 109.78 62.96 109.87 63.08 109.95 63.01 110.03 62.97 110.12 62.98 110.2 63.14 110.28 63.5 110.37 63.41 110.45 63.46 110.53 63.18 110.62 62.84 110.7 62.74 110.78 62.69 110.86 62.98 110.95 62.74 111.03 62.87 111.11 62.72 111.2 62.5 111.28 62.46 111.36 62.71 111.45 62.47 111.53 62.53 111.61 62.91 111.7 63.16 111.78 63 111.86 63.01 111.95 63.21 112.03 62.76 112.11 62.62 112.2 62.5 112.28 62.48 112.36 62.38 112.45 62.26 112.53 62.6 112.61 62.77 112.69 62.8 112.78 62.81 112.86 62.79 112.94 62.61 113.03 62.45 113.11 62.69 113.19 62.78 113.28 62.98 113.36 63.51 113.44 63.37 113.53 63.53 113.61 63.86 113.69 63.84 113.78 63.7 113.86 63.65 113.94 63.59 114.03 63.53 114.11 63.52 114.19 63.57 114.27 63.8 114.36 63.88 114.44 63.86 114.52 64.02 114.61 64.1 114.69 63.86 114.77 64.22 114.86 64 114.94 63.89 115.02 64.07 115.11 64.15 115.19 64.17 115.27 64.53 115.36 64.49 115.44 64.51 115.52 64.34 115.61 64.48 115.69 64.57 115.77 64.59 115.85 64.63 115.94 64.73 116.02 64.45 116.1 64.7 116.19 64.64 116.27 64.63 116.35 64.82 116.44 64.88 116.52 64.78 116.6 64.77 116.69 64.74 116.77 64.88 116.85 64.93 116.94 64.79 117.02 65 117.1 65.33 117.19 65.12 117.27 65.07 117.35 65.01 117.43 64.83 117.52 64.41 117.6 64.2 117.68 64.18 117.77 64.36 117.85 64.55 117.93 64.52 118.02 64.46 118.1 64.25 118.18 64.2 118.27 64.33 118.35 64.23 118.43 64.22 118.52 63.98 118.6 63.98 118.68 63.94 118.77 64.08 118.85 64.13 118.93 63.86 119.01 63.95 119.1 63.82 119.18 63.91 119.26 63.9 119.35 64.17 119.43 64.19 119.51 64.36 119.6 64.4 119.68 64.11 119.76 63.96 119.85 63.74 119.93 63.71 120.01 63.84 120.1 63.88 120.18 63.45 120.26 63.46 120.35 63.21 120.43 62.97 120.51 62.98 120.59 63.17 120.68 62.99 120.76 62.8 120.84 63.03 120.93 62.7 121.01 62.46 121.09 62.56 121.18 62.88 121.26 62.84 121.34 62.67 121.43 62.6 121.51 62.52 121.59 62.71 121.68 62.71 121.76 62.58 121.84 62.45 121.93 62.44 122.01 62.01 122.09 61.58 122.18 61.67 122.26 61.72 122.34 61.6 122.42 61.57 122.51 61.33 122.59 61.44 122.67 61.61 122.76 61.53 122.84 61.29 122.92 61.42 123.01 61.65 123.09 61.61 123.17 61.58 123.26 61.64 123.34 61.78 123.42 61.56 123.51 61.46 123.59 61.81 123.67 61.64 123.76 61.17 123.84 60.91 123.92 61.22 124 61.24 124.09 61.14 124.17 60.9 124.25 61 124.34 60.75 124.42 60.67 124.5 60.48 124.59 60.99 124.67 60.79 124.75 60.43 124.84 60.46 124.92 60.15 125 59.84 125.09 59.6 125.17 59.65 125.25 60.01 125.34 60.25 125.42 59.96 125.5 59.92 125.58 59.77" class="geometry color_" stroke="#7E273E"/>
        <path fill="none" d="M21.63,44.35 L 21.71 44.35 21.8 44.07 21.88 43.57 21.96 43.38 22.05 43.86 22.13 43.72 22.21 43.82 22.3 43.43 22.38 43.42 22.46 43.84 22.55 43.94 22.63 44.38 22.71 44.29 22.8 44.8 22.88 45.21 22.96 44.91 23.05 45.03 23.13 44.67 23.21 44.74 23.29 44.82 23.38 44.39 23.46 44.44 23.54 43.95 23.63 43.34 23.71 43.36 23.79 43.62 23.88 43.16 23.96 43.73 24.04 43.89 24.13 43.97 24.21 44.09 24.29 44.15 24.38 44.4 24.46 44.46 24.54 44.57 24.63 44.84 24.71 44.89 24.79 44.86 24.88 45.38 24.96 45.69 25.04 45.34 25.12 45.33 25.21 44.81 25.29 44.77 25.37 45.07 25.46 45.2 25.54 45.35 25.62 45.11 25.71 44.82 25.79 44.61 25.87 44.81 25.96 44.77 26.04 44.03 26.12 44.49 26.21 44.89 26.29 44.95 26.37 44.94 26.46 44.71 26.54 44.42 26.62 44.62 26.7 43.89 26.79 43.72 26.87 43.75 26.95 43.89 27.04 43.79 27.12 43.87 27.2 43.97 27.29 44.53 27.37 44.58 27.45 44.46 27.54 44.55 27.62 44.78 27.7 45.39 27.79 45.79 27.87 46.12 27.95 45.77 28.04 46.29 28.12 46.32 28.2 45.9 28.28 45.44 28.37 45.71 28.45 46.22 28.53 45.97 28.62 45.45 28.7 45.76 28.78 45.41 28.87 45.42 28.95 45.64 29.03 46.13 29.12 46.43 29.2 46.69 29.28 46.37 29.37 46.17 29.45 46.34 29.53 46.53 29.62 46.63 29.7 46.44 29.78 46.13 29.86 45.88 29.95 46.06 30.03 46.34 30.11 46.56 30.2 45.87 30.28 46.19 30.36 46.63 30.45 46.87 30.53 46.82 30.61 46.68 30.7 47.2 30.78 47.45 30.86 47.55 30.95 47.58 31.03 46.98 31.11 47.24 31.2 47.03 31.28 47.32 31.36 47.26 31.44 47.89 31.53 48.34 31.61 47.96 31.69 47.25 31.78 47.61 31.86 48.05 31.94 47.72 32.03 48.22 32.11 48.13 32.19 47.9 32.28 47.56 32.36 47.95 32.44 48.77 32.53 48.23 32.61 48.27 32.69 48.32 32.78 48.78 32.86 48.4 32.94 48.58 33.02 48.33 33.11 48.69 33.19 48.85 33.27 48.91 33.36 48.83 33.44 48.92 33.52 48.84 33.61 48.88 33.69 49.06 33.77 48.94 33.86 48.96 33.94 48.96 34.02 49.18 34.11 49.05 34.19 48.73 34.27 48.46 34.36 47.96 34.44 47.47 34.52 47.26 34.61 46.93 34.69 46.17 34.77 46.89 34.85 46.89 34.94 46.7 35.02 46.51 35.1 46.71 35.19 46.9 35.27 47.17 35.35 47.07 35.44 47.12 35.52 46.84 35.6 46.83 35.69 46.5 35.77 46.94 35.85 46.47 35.94 46.19 36.02 45.94 36.1 46.03 36.19 46.28 36.27 46.59 36.35 46.66 36.43 47.17 36.52 47.22 36.6 47.16 36.68 47.19 36.77 46.99 36.85 47.58 36.93 47.97 37.02 47.98 37.1 47.88 37.18 47.73 37.27 47.97 37.35 47.88 37.43 47.62 37.52 47.61 37.6 47.39 37.68 47.79 37.77 48.01 37.85 48.27 37.93 48.3 38.01 48.87 38.1 49 38.18 49.44 38.26 49.22 38.35 48.9 38.43 49.88 38.51 50.4 38.6 49.99 38.68 50.6 38.76 50.97 38.85 50.75 38.93 50.59 39.01 50.97 39.1 50.87 39.18 51.18 39.26 50.98 39.35 51.14 39.43 51.9 39.51 51.65 39.59 52.18 39.68 52.03 39.76 52.56 39.84 52.41 39.93 52.56 40.01 53.09 40.09 52.87 40.18 52.95 40.26 53.1 40.34 53.35 40.43 53.35 40.51 53.43 40.59 53.15 40.68 53.04 40.76 52.59 40.84 52.66 40.93 52.63 41.01 52.72 41.09 52.74 41.17 52.91 41.26 53.16 41.34 52.83 41.42 52.54 41.51 52.92 41.59 52.68 41.67 52.55 41.76 52.63 41.84 52.96 41.92 52.9 42.01 52.97 42.09 52.99 42.17 53.16 42.26 52.89 42.34 53.05 42.42 53.35 42.51 53.35 42.59 53.78 42.67 53.45 42.75 53.41 42.84 53.15 42.92 52.75 43 52.83 43.09 52.51 43.17 52.49 43.25 52.42 43.34 52.14 43.42 52.47 43.5 52.51 43.59 52.93 43.67 52.49 43.75 52 43.84 51.48 43.92 51.39 44 51.57 44.09 51.67 44.17 52.44 44.25 52.56 44.34 52.38 44.42 52.53 44.5 52.52 44.58 52.76 44.67 52.79 44.75 53.25 44.83 53.59 44.92 53.83 45 53.92 45.08 53.71 45.17 53.59 45.25 53.59 45.33 53.53 45.42 53.31 45.5 53.4 45.58 53.31 45.67 53.91 45.75 53.79 45.83 53.64 45.92 54.26 46 54.31 46.08 53.79 46.16 54.4 46.25 54.49 46.33 55.03 46.41 54.72 46.5 54.93 46.58 55 46.66 55.31 46.75 55.35 46.83 55.64 46.91 56.12 47 56.74 47.08 57.13 47.16 56.77 47.25 56.52 47.33 56.42 47.41 56.53 47.5 56.17 47.58 56.16 47.66 55.69 47.74 55.54 47.83 55.39 47.91 55.46 47.99 55.34 48.08 55.16 48.16 55.26 48.24 55.11 48.33 54.88 48.41 55.21 48.49 54.96 48.58 55.2 48.66 55.24 48.74 54.83 48.83 55.04 48.91 55.32 48.99 55.17 49.08 55.03 49.16 54.77 49.24 54.65 49.32 54.49 49.41 54.11 49.49 54.25 49.57 54.08 49.66 54.23 49.74 53.81 49.82 53.63 49.91 53.88 49.99 53.66 50.07 53.87 50.16 54.56 50.24 54.72 50.32 55.08 50.41 54.91 50.49 54.7 50.57 54.72 50.66 54.79 50.74 54.85 50.82 54.93 50.9 55.24 50.99 55.22 51.07 55.08 51.15 54.76 51.24 54.75 51.32 54.73 51.4 54.68 51.49 54.69 51.57 54.66 51.65 54.69 51.74 54.6 51.82 55.08 51.9 55.49 51.99 55.75 52.07 55.67 52.15 55.49 52.24 55.24 52.32 55.67 52.4 55.68 52.48 55.57 52.57 55.98 52.65 56.32 52.73 56.32 52.82 55.89 52.9 55.98 52.98 56.26 53.07 55.92 53.15 56.14 53.23 56.04 53.32 56.16 53.4 56.14 53.48 56.11 53.57 56.37 53.65 56.13 53.73 55.81 53.82 56.01 53.9 55.88 53.98 56.14 54.07 56.16 54.15 56.27 54.23 55.92 54.31 56.15 54.4 56.04 54.48 55.66 54.56 55.52 54.65 55.33 54.73 55.45 54.81 55.42 54.9 55.44 54.98 55.41 55.06 55.18 55.15 55.23 55.23 55.17 55.31 54.89 55.4 55.04 55.48 55.02 55.56 54.92 55.65 54.98 55.73 54.88 55.81 54.48 55.89 54.31 55.98 53.81 56.06 53.93 56.14 54.26 56.23 54.15 56.31 54.34 56.39 54.84 56.48 54.43 56.56 54.57 56.64 54.38 56.73 54.45 56.81 54.34 56.89 54.53 56.98 54.64 57.06 54.97 57.14 54.8 57.23 54.7 57.31 55.21 57.39 55.41 57.47 55.35 57.56 55.01 57.64 55.02 57.72 54.96 57.81 55.92 57.89 56.53 57.97 56.93 58.06 56.85 58.14 56.89 58.22 57.02 58.31 56.75 58.39 56.96 58.47 57.07 58.56 57.17 58.64 56.9 58.72 56.85 58.81 56.68 58.89 56.81 58.97 56.99 59.05 57.04 59.14 56.83 59.22 56.7 59.3 56.02 59.39 56.12 59.47 56.3 59.55 56.1 59.64 56.32 59.72 56.31 59.8 56.57 59.89 56.91 59.97 57.18 60.05 57.03 60.14 57.08 60.22 56.95 60.3 57.25 60.39 57.17 60.47 57.06 60.55 57.01 60.63 57.07 60.72 57.28 60.8 57.69 60.88 57.9 60.97 57.87 61.05 57.53 61.13 57.6 61.22 57.55 61.3 57.36 61.38 57.49 61.47 57.65 61.55 57.59 61.63 56.87 61.72 56.93 61.8 56.87 61.88 56.86 61.97 56.97 62.05 56.39 62.13 55.98 62.21 55.94 62.3 55.82 62.38 55.92 62.46 55.94 62.55 55.57 62.63 56.01 62.71 55.55 62.8 55.38 62.88 55.36 62.96 54.98 63.05 55.17 63.13 54.96 63.21 54.79 63.3 54.79 63.38 54.56 63.46 54.65 63.55 54.65 63.63 54.75 63.71 54.63 63.8 54.74 63.88 54.78 63.96 54.36 64.04 54.27 64.13 54.67 64.21 54.13 64.29 53.93 64.38 53.72 64.46 53.68 64.54 53.53 64.63 53.36 64.71 53.62 64.79 53.54 64.88 54.11 64.96 54.15 65.04 53.88 65.13 54.48 65.21 54.41 65.29 54.9 65.38 54.77 65.46 54.51 65.54 54.31 65.62 54.18 65.71 54.57 65.79 54.56 65.87 54.43 65.96 53.88 66.04 53.68 66.12 53.48 66.21 53.3 66.29 53.18 66.37 53.15 66.46 53.31 66.54 52.99 66.62 52.93 66.71 52.94 66.79 52.96 66.87 53.17 66.96 53.4 67.04 53.53 67.12 53.14 67.2 53.4 67.29 53.79 67.37 53.65 67.45 53.85 67.54 53.96 67.62 54.06 67.7 54.25 67.79 54.02 67.87 54.46 67.95 54.49 68.04 54.58 68.12 54.27 68.2 54.21 68.29 54.71 68.37 54.66 68.45 54.66 68.54 54.56 68.62 54.63 68.7 54.71 68.78 54.63 68.87 54.08 68.95 54.45 69.03 54.19 69.12 54.31 69.2 54.01 69.28 53.66 69.37 53.69 69.45 53.44 69.53 53.22 69.62 53 69.7 53.24 69.78 53.41 69.87 53.63 69.95 53.56 70.03 53.75 70.12 54.01 70.2 53.74 70.28 53.84 70.36 53.67 70.45 54.05 70.53 53.52 70.61 53.3 70.7 53.69 70.78 53.88 70.86 53.6 70.95 53.02 71.03 53.42 71.11 53.41 71.2 53.65 71.28 53.66 71.36 53.62 71.45 53.71 71.53 53.03 71.61 53.18 71.7 52.3 71.78 52.1 71.86 52.29 71.94 52.69 72.03 52.83 72.11 52.59 72.19 52.51 72.28 52.48 72.36 52.21 72.44 52.09 72.53 52.31 72.61 52.51 72.69 52.12 72.78 51.6 72.86 51.07 72.94 50.97 73.03 50.6 73.11 50.4 73.19 50.64 73.28 50.32 73.36 50.21 73.44 50.34 73.53 50.32 73.61 50.67 73.69 51.2 73.77 51.46 73.86 50.84 73.94 50.52 74.02 50.4 74.11 50.62 74.19 50.68 74.27 51.36 74.36 51.29 74.44 51.65 74.52 51.38 74.61 51.82 74.69 51.54 74.77 51.95 74.86 51.84 74.94 52.15 75.02 51.85 75.11 51.89 75.19 51.2 75.27 51.16 75.35 51.16 75.44 51.67 75.52 51.87 75.6 51.93 75.69 51.79 75.77 51.92 75.85 52 75.94 52.17 76.02 52.11 76.1 52.06 76.19 51.92 76.27 52.42 76.35 52.47 76.44 52.46 76.52 53 76.6 52.94 76.69 52.98 76.77 53.54 76.85 53.69 76.93 53.41 77.02 53.38 77.1 53.46 77.18 52.96 77.27 52.63 77.35 52.81 77.43 52.43 77.52 53.04 77.6 53.68 77.68 53.09 77.77 52.65 77.85 52.32 77.93 52.34 78.02 52.62 78.1 52.57 78.18 53.01 78.27 53.33 78.35 53.39 78.43 53.3 78.51 53.31 78.6 53.13 78.68 52.83 78.76 52.61 78.85 52.28 78.93 52.04 79.01 52.2 79.1 52.57 79.18 52.47 79.26 52.03 79.35 52.04 79.43 51.87 79.51 51.8 79.6 52.02 79.68 52.11 79.76 51.56 79.85 51.1 79.93 51.03 80.01 51.25 80.09 50.98 80.18 50.67 80.26 50.12 80.34 50.68 80.43 51.41 80.51 51.59 80.59 51.38 80.68 51.28 80.76 50.76 80.84 50.62 80.93 50.4 81.01 50.47 81.09 50.72 81.18 50.77 81.26 50.51 81.34 49.69 81.43 49.6 81.51 49.19 81.59 49.55 81.67 49.8 81.76 49.66 81.84 49.53 81.92 49.96 82.01 50.06 82.09 50.44 82.17 50.33 82.26 50.35 82.34 50.46 82.42 50.67 82.51 51.36 82.59 51.45 82.67 51.59 82.76 51.13 82.84 50.87 82.92 50.55 83.01 50.79 83.09 51.37 83.17 51.17 83.26 51.15 83.34 51.06 83.42 51.76 83.5 51.27 83.59 51.99 83.67 52.17 83.75 52.61 83.84 52.76 83.92 52.65 84 52.54 84.09 52.54 84.17 52.87 84.25 53.17 84.34 52.9 84.42 53.06 84.5 52.76 84.59 53.52 84.67 53.57 84.75 53.9 84.84 53.93 84.92 53.88 85 54.34 85.08 54.24 85.17 54.65 85.25 55.27 85.33 55.01 85.42 55.07 85.5 55.23 85.58 54.97 85.67 55.02 85.75 54.96 85.83 54.87 85.92 55.13 86 55.2 86.08 54.8 86.17 54.86 86.25 54.88 86.33 54.72 86.42 54.71 86.5 54.7 86.58 54.83 86.66 54.93 86.75 54.78 86.83 54.71 86.91 54.47 87 54.79 87.08 54.61 87.16 54.76 87.25 54.89 87.33 54.85 87.41 54.31 87.5 54.39 87.58 54.12 87.66 54.29 87.75 54.44 87.83 54.28 87.91 53.59 88 53.19 88.08 53.2 88.16 52.75 88.24 52.91 88.33 53.03 88.41 53.12 88.49 53.69 88.58 53.72 88.66 53.49 88.74 53.9 88.83 54.04 88.91 54.29 88.99 54.08 89.08 54.58 89.16 54.73 89.24 54.27 89.33 54.38 89.41 53.84 89.49 54.3 89.58 54.03 89.66 54.05 89.74 54.3 89.82 54.03 89.91 53.84 89.99 53.74 90.07 54.03 90.16 54.5 90.24 54.17 90.32 54.39 90.41 54.67 90.49 54.7 90.57 54.78 90.66 54.48 90.74 54.13 90.82 54.03 90.91 53.97 90.99 53.63 91.07 53.85 91.16 53.8 91.24 54.04 91.32 53.66 91.4 53.81 91.49 53.73 91.57 53.53 91.65 53.79 91.74 53.51 91.82 53.66 91.9 53.82 91.99 53.77 92.07 53.93 92.15 54.42 92.24 54.34 92.32 53.86 92.4 53.84 92.49 53.7 92.57 53.02 92.65 52.88 92.74 53.05 92.82 53.07 92.9 53.83 92.99 53.77 93.07 54.08 93.15 54.32 93.23 54.01 93.32 54.09 93.4 54.36 93.48 54.25 93.57 54.14 93.65 54.23 93.73 54.06 93.82 54.01 93.9 53.79 93.98 53.78 94.07 53.79 94.15 53.81 94.23 53.7 94.32 54.56 94.4 54.32 94.48 54.54 94.57 54.57 94.65 54.58 94.73 55.1 94.81 54.65 94.9 54.61 94.98 54.98 95.06 55.19 95.15 55.47 95.23 55.75 95.31 55.99 95.4 55.72 95.48 55.57 95.56 55.36 95.65 55.21 95.73 55.24 95.81 55.53 95.9 55.7 95.98 55.38 96.06 55.3 96.15 55.18 96.23 55.39 96.31 55.36 96.39 55.47 96.48 55.48 96.56 55.29 96.64 55.19 96.73 55.07 96.81 54.99 96.89 55.42 96.98 55.05 97.06 55.03 97.14 55.16 97.23 55 97.31 54.84 97.39 54.96 97.48 54.86 97.56 54.91 97.64 54.9 97.73 55.21 97.81 55.01 97.89 55.15 97.97 55.25 98.06 55.26 98.14 55.15 98.22 55.65 98.31 55.73 98.39 55.5 98.47 55.27 98.56 55.78 98.64 55.62 98.72 55.97 98.81 56.45 98.89 56.71 98.97 56.88 99.06 56.44 99.14 56.31 99.22 56.22 99.31 56.01 99.39 56.13 99.47 55.88 99.55 55.64 99.64 55.27 99.72 55.25 99.8 55.04 99.89 54.82 99.97 55.17 100.05 54.96 100.14 54.68 100.22 54.8 100.3 54.57 100.39 54.59 100.47 55.05 100.55 54.73 100.64 54.84 100.72 54.5 100.8 54.6 100.89 54.57 100.97 54.26 101.05 54.3 101.13 54.19 101.22 54.29 101.3 54.52 101.38 54.26 101.47 54.38 101.55 54.53 101.63 54.13 101.72 53.96 101.8 53.85 101.88 53.58 101.97 53.74 102.05 53.99 102.13 53.41 102.22 53.49 102.3 53.03 102.38 52.77 102.47 52.53 102.55 52.06 102.63 52.02 102.72 52.66 102.8 52.41 102.88 52.2 102.96 52.26 103.05 52.41 103.13 52.7 103.21 53.17 103.3 53.02 103.38 52.63 103.46 52.87 103.55 52.59 103.63 52.78 103.71 52.78 103.8 52.96 103.88 53.48 103.96 53.18 104.05 53.19 104.13 52.71 104.21 52.7 104.3 53.06 104.38 52.75 104.46 52.72 104.54 52.86 104.63 52.79 104.71 52.51 104.79 52.67 104.88 52.67 104.96 52.3 105.04 52.07 105.13 52.38 105.21 52.96 105.29 53.28 105.38 53.4 105.46 53 105.54 53.39 105.63 52.92 105.71 53.59 105.79 53.45 105.88 53.88 105.96 53.76 106.04 54.11 106.12 54.4 106.21 54.74 106.29 54.71 106.37 54.73 106.46 54.77 106.54 54.86 106.62 55.06 106.71 54.75 106.79 54.66 106.87 55.11 106.96 55.06 107.04 55.06 107.12 55.27 107.21 55.17 107.29 55.55 107.37 55.29 107.46 55.51 107.54 55.55 107.62 55.51 107.7 55.2 107.79 55.57 107.87 55.6 107.95 55.76 108.04 56.06 108.12 56.02 108.2 55.71 108.29 55.26 108.37 55.24 108.45 54.67 108.54 54.46 108.62 54.35 108.7 54.68 108.79 54.55 108.87 54.16 108.95 54.3 109.04 54.16 109.12 54.48 109.2 54.38 109.28 54.15 109.37 54.67 109.45 54.92 109.53 54.88 109.62 54.5 109.7 54.73 109.78 54.94 109.87 55.47 109.95 55.52 110.03 56.01 110.12 55.82 110.2 56 110.28 55.45 110.37 55.58 110.45 55.48 110.53 55.97 110.62 55.57 110.7 55.66 110.78 55.74 110.86 55.94 110.95 56.03 111.03 56.31 111.11 56.33 111.2 56.73 111.28 56.65 111.36 56.43 111.45 56.06 111.53 55.58 111.61 55.43 111.7 55.02 111.78 54.47 111.86 54.38 111.95 53.77 112.03 54.59 112.11 54.88 112.2 55.09 112.28 54.73 112.36 55.35 112.45 55.53 112.53 55.33 112.61 55.34 112.69 55.3 112.78 55.32 112.86 55.57 112.94 55.42 113.03 55.78 113.11 55.7 113.19 55.46 113.28 55.56 113.36 55.84 113.44 55.56 113.53 55.14 113.61 54.52 113.69 54.6 113.78 54.76 113.86 54.72 113.94 54.78 114.03 54.16 114.11 54.31 114.19 54.32 114.27 54.44 114.36 54.1 114.44 54.51 114.52 54.47 114.61 54.5 114.69 54.56 114.77 54.55 114.86 54.43 114.94 54.58 115.02 54.49 115.11 54.69 115.19 54.59 115.27 54.61 115.36 54.91 115.44 54.9 115.52 54.31 115.61 54.24 115.69 53.66 115.77 53.44 115.85 53.41 115.94 53.27 116.02 52.79 116.1 52.71 116.19 52.76 116.27 52.7 116.35 52.41 116.44 52.52 116.52 52.3 116.6 52.12 116.69 52.81 116.77 52.53 116.85 52.53 116.94 52.62 117.02 53.31 117.1 52.91 117.19 53.2 117.27 53.15 117.35 52.88 117.43 52.86 117.52 52.56 117.6 52.55 117.68 52.81 117.77 53.05 117.85 53.14 117.93 52.68 118.02 52.33 118.1 52.37 118.18 52.27 118.27 52.08 118.35 51.97 118.43 51.76 118.52 51.77 118.6 51.53 118.68 51.89 118.77 51.79 118.85 51.92 118.93 52.19 119.01 51.78 119.1 51.77 119.18 51.61 119.26 52.29 119.35 52.04 119.43 51.92 119.51 52.16 119.6 51.75 119.68 51.54 119.76 51.71 119.85 51.48 119.93 51.61 120.01 51.8 120.1 51.91 120.18 52.14 120.26 52.28 120.35 51.87 120.43 52.16 120.51 52.24 120.59 52.52 120.68 52.78 120.76 53.09 120.84 53.54 120.93 53.25 121.01 53.66 121.09 53.53 121.18 53.65 121.26 53.45 121.34 54.13 121.43 53.79 121.51 54.08 121.59 53.97 121.68 53.95 121.76 54.32 121.84 54.37 121.93 54.55 122.01 54.38 122.09 54.4 122.18 54.32 122.26 54.23 122.34 54.5 122.42 54.6 122.51 54.63 122.59 54.67 122.67 54.7 122.76 54.8 122.84 54.94 122.92 54.82 123.01 54.85 123.09 55.15 123.17 55.08 123.26 54.49 123.34 54.71 123.42 54.73 123.51 54.81 123.59 54.82 123.67 54.34 123.76 53.94 123.84 53.72 123.92 53.67 124 53.22 124.09 53.55 124.17 54.15 124.25 54.28 124.34 54.16 124.42 54.33 124.5 53.89 124.59 53.66 124.67 53.47 124.75 53.29 124.84 53.45 124.92 53.26 125 52.99 125.09 53.13 125.17 53.26 125.25 52.94 125.34 52.83 125.42 53.14 125.5 53.11 125.58 52.86" class="geometry color_" stroke="#88C4C4"/>
        <path fill="none" d="M21.63,44.35 L 21.71 44.35 21.8 43.82 21.88 43.35 21.96 43.62 22.05 43.41 22.13 43.51 22.21 43.12 22.3 43.17 22.38 43.28 22.46 43.12 22.55 43.57 22.63 43.75 22.71 43.63 22.8 43.98 22.88 43.62 22.96 43.35 23.05 43.91 23.13 43.7 23.21 43.69 23.29 43.56 23.38 43.1 23.46 42.4 23.54 42.32 23.63 41.86 23.71 41.8 23.79 41.96 23.88 41.58 23.96 41.58 24.04 41.28 24.13 41.33 24.21 41.47 24.29 42.07 24.38 41.85 24.46 41.49 24.54 41.28 24.63 41.2 24.71 40.51 24.79 40.83 24.88 41.52 24.96 41.24 25.04 40.84 25.12 40.88 25.21 40.52 25.29 40.31 25.37 40.02 25.46 40.27 25.54 40.01 25.62 39.5 25.71 39.12 25.79 39.49 25.87 39.58 25.96 39.03 26.04 39.65 26.12 39.3 26.21 38.4 26.29 38.48 26.37 37.79 26.46 38.67 26.54 38.72 26.62 38.51 26.7 37.99 26.79 37.51 26.87 38 26.95 38.93 27.04 40.04 27.12 39.6 27.2 40.1 27.29 39.59 27.37 40.61 27.45 40.38 27.54 40.78 27.62 40.93 27.7 40.87 27.79 40.21 27.87 40.01 27.95 40.13 28.04 40.52 28.12 41.19 28.2 41.39 28.28 40.64 28.37 40.43 28.45 40.12 28.53 40.09 28.62 39.89 28.7 39.28 28.78 38.87 28.87 38.37 28.95 38.06 29.03 38.13 29.12 37.91 29.2 37.97 29.28 38.41 29.37 37.79 29.45 37.43 29.53 37.73 29.62 37.14 29.7 37.01 29.78 37.35 29.86 38.33 29.95 38.47 30.03 38.95 30.11 39.03 30.2 38.83 30.28 38.36 30.36 38.38 30.45 38.73 30.53 38.59 30.61 38.35 30.7 38.39 30.78 38.76 30.86 38.39 30.95 38.07 31.03 38.59 31.11 37.94 31.2 38.01 31.28 37.75 31.36 38.02 31.44 38.64 31.53 38.95 31.61 39.85 31.69 40.43 31.78 40.51 31.86 41.07 31.94 41.35 32.03 41.35 32.11 42.09 32.19 42.06 32.28 42.72 32.36 43.36 32.44 43.35 32.53 42.11 32.61 42.05 32.69 42.11 32.78 42.49 32.86 42.71 32.94 42.87 33.02 42.73 33.11 42.66 33.19 42.45 33.27 43.18 33.36 42.83 33.44 42.3 33.52 42.45 33.61 42.02 33.69 42.7 33.77 43.11 33.86 42.7 33.94 42.28 34.02 41.78 34.11 41.2 34.19 41.35 34.27 41.99 34.36 41.89 34.44 41.63 34.52 41.88 34.61 41.92 34.69 41.77 34.77 41.87 34.85 42.01 34.94 41.82 35.02 42.38 35.1 42.11 35.19 42.32 35.27 41.71 35.35 41.14 35.44 41.57 35.52 41.47 35.6 41.16 35.69 41.46 35.77 41.77 35.85 42.38 35.94 42.65 36.02 41.59 36.1 41.68 36.19 41.08 36.27 40.61 36.35 40.61 36.43 40.52 36.52 40.38 36.6 39.92 36.68 39.28 36.77 39.67 36.85 39.31 36.93 39.8 37.02 39.64 37.1 38.95 37.18 38.78 37.27 38.29 37.35 38.85 37.43 39.28 37.52 39.68 37.6 39.76 37.68 39.35 37.77 39.41 37.85 39.68 37.93 39.39 38.01 38.83 38.1 38.34 38.18 37.49 38.26 37.61 38.35 36.62 38.43 36.75 38.51 35.54 38.6 35.5 38.68 34.91 38.76 34.37 38.85 35.17 38.93 35.08 39.01 35.28 39.1 35.12 39.18 35.33 39.26 35.92 39.35 36.39 39.43 36.28 39.51 35.95 39.59 35.86 39.68 35.85 39.76 36.27 39.84 35.76 39.93 35.02 40.01 34.67 40.09 34.56 40.18 34.29 40.26 33.88 40.34 33.39 40.43 32.52 40.51 32.43 40.59 32.21 40.68 31.44 40.76 30.78 40.84 31.24 40.93 31.2 41.01 30.66 41.09 31.18 41.17 30.54 41.26 31.36 41.34 30.24 41.42 30.84 41.51 30.62 41.59 31.3 41.67 31.37 41.76 30.73 41.84 30.25 41.92 30.77 42.01 31.69 42.09 32.8 42.17 32.62 42.26 32.83 42.34 32.62 42.42 32.67 42.51 32.67 42.59 32.36 42.67 31.79 42.75 31.72 42.84 31.78 42.92 33.18 43 33.88 43.09 33.18 43.17 32.94 43.25 32.61 43.34 32.28 43.42 31.95 43.5 31.5 43.59 31.75 43.67 31.85 43.75 30.89 43.84 30.47 43.92 29.53 44 29.08 44.09 29.19 44.17 29.02 44.25 29.16 44.34 29.22 44.42 28.41 44.5 28.59 44.58 28.75 44.67 28.88 44.75 29.41 44.83 29.03 44.92 28.8 45 28.75 45.08 28.39 45.17 28.13 45.25 27.5 45.33 27.71 45.42 27.52 45.5 28.54 45.58 27.37 45.67 27.1 45.75 27.01 45.83 26.66 45.92 26.62 46 26.09 46.08 26.34 46.16 27.1 46.25 27.22 46.33 27.45 46.41 28.84 46.5 28.77 46.58 27.76 46.66 28.34 46.75 27.56 46.83 26.91 46.91 27.25 47 27.42 47.08 26.58 47.16 27.01 47.25 26.8 47.33 27.14 47.41 27.04 47.5 27.19 47.58 27.37 47.66 26.54 47.74 26.92 47.83 25.82 47.91 25.49 47.99 25.82 48.08 25.69 48.16 25.16 48.24 25.98 48.33 25.8 48.41 26.01 48.49 25.83 48.58 26.25 48.66 25.89 48.74 25.96 48.83 26.66 48.91 26.72 48.99 26.3 49.08 27.09 49.16 27.79 49.24 28.33 49.32 28.16 49.41 28.43 49.49 28.07 49.57 28.67 49.66 28.95 49.74 28.74 49.82 28.63 49.91 28.51 49.99 27.73 50.07 27.61 50.16 27.26 50.24 27.02 50.32 27.05 50.41 28.27 50.49 28.65 50.57 29.26 50.66 29.26 50.74 29.67 50.82 30.2 50.9 30.14 50.99 30.85 51.07 30.3 51.15 29.97 51.24 30.51 51.32 30.39 51.4 30.36 51.49 29.56 51.57 29.99 51.65 30.95 51.74 30.78 51.82 31.23 51.9 31.85 51.99 32.23 52.07 32.4 52.15 32.24 52.24 31.59 52.32 31.7 52.4 32.2 52.48 32.2 52.57 32.17 52.65 31.69 52.73 31.74 52.82 32.33 52.9 32.52 52.98 32.73 53.07 32.41 53.15 33.3 53.23 32.88 53.32 32.54 53.4 32.8 53.48 32.23 53.57 32.45 53.65 31.72 53.73 32.3 53.82 32.26 53.9 32.38 53.98 32.33 54.07 32.11 54.15 31.9 54.23 31.51 54.31 31.28 54.4 31.09 54.48 31.03 54.56 31.08 54.65 31.49 54.73 31.49 54.81 32.05 54.9 30.97 54.98 31.25 55.06 31.61 55.15 31.55 55.23 31.1 55.31 30.14 55.4 30.74 55.48 30.74 55.56 30.67 55.65 30.62 55.73 31.3 55.81 31.84 55.89 32.05 55.98 32.89 56.06 33.02 56.14 32.98 56.23 32.61 56.31 32.38 56.39 32.13 56.48 32.52 56.56 32.5 56.64 32.2 56.73 32 56.81 32.13 56.89 33.17 56.98 33.07 57.06 33.21 57.14 33.81 57.23 34.06 57.31 34.47 57.39 35.05 57.47 34.32 57.56 34.82 57.64 35.27 57.72 35.19 57.81 36.21 57.89 36.18 57.97 36.29 58.06 36.3 58.14 36.21 58.22 36.94 58.31 35.98 58.39 35.51 58.47 35.88 58.56 36.81 58.64 37 58.72 38.13 58.81 38.12 58.89 37.47 58.97 37.59 59.05 36.95 59.14 37.15 59.22 36.98 59.3 36.75 59.39 36.33 59.47 36.04 59.55 35.18 59.64 35.61 59.72 35.02 59.8 35.07 59.89 35.36 59.97 34.3 60.05 34.29 60.14 34.11 60.22 33.72 60.3 34.46 60.39 34.71 60.47 35.04 60.55 35.52 60.63 35.59 60.72 35.96 60.8 36.13 60.88 36.11 60.97 36.4 61.05 36.31 61.13 36.66 61.22 36.62 61.3 36.52 61.38 36.35 61.47 35.81 61.55 36.37 61.63 36.91 61.72 36.56 61.8 36.96 61.88 37.22 61.97 37.67 62.05 37.68 62.13 37.76 62.21 37.39 62.3 37.42 62.38 38.18 62.46 38.43 62.55 38.64 62.63 37.65 62.71 37.71 62.8 37.22 62.88 36.49 62.96 36.46 63.05 36.29 63.13 36.22 63.21 34.85 63.3 34.85 63.38 35.46 63.46 35.36 63.55 35.61 63.63 35.8 63.71 35.65 63.8 36.25 63.88 36.42 63.96 36.22 64.04 35.64 64.13 36.05 64.21 35.72 64.29 35.77 64.38 35.53 64.46 35.59 64.54 35.91 64.63 36.07 64.71 36.79 64.79 36.28 64.88 36.33 64.96 36.07 65.04 35.45 65.13 36.03 65.21 35.74 65.29 34.79 65.38 34.94 65.46 34.66 65.54 34.71 65.62 35.15 65.71 35.52 65.79 35.62 65.87 36.2 65.96 36.05 66.04 36.23 66.12 35.51 66.21 35.97 66.29 35.76 66.37 35.9 66.46 36.13 66.54 35.44 66.62 34.84 66.71 35.93 66.79 35.63 66.87 35.88 66.96 36.16 67.04 37.13 67.12 37.9 67.2 37.66 67.29 37.38 67.37 37.12 67.45 37.08 67.54 37.62 67.62 37.56 67.7 37.39 67.79 37.76 67.87 38.22 67.95 38.51 68.04 38.62 68.12 39.75 68.2 39.17 68.29 39.13 68.37 39.5 68.45 38.87 68.54 38.62 68.62 38.5 68.7 37.95 68.78 38.79 68.87 37.93 68.95 38.26 69.03 37.99 69.12 37.21 69.2 36.72 69.28 37.05 69.37 36.79 69.45 37.28 69.53 37.43 69.62 37.16 69.7 37.2 69.78 37.51 69.87 37.84 69.95 37.95 70.03 37.97 70.12 38.85 70.2 39.13 70.28 39.1 70.36 39 70.45 37.66 70.53 37.01 70.61 36.61 70.7 36.89 70.78 37.07 70.86 37.09 70.95 36.89 71.03 37.44 71.11 37.1 71.2 36.33 71.28 36.12 71.36 36.89 71.45 36.27 71.53 37.05 71.61 37.36 71.7 38.02 71.78 38.11 71.86 38.45 71.94 37.81 72.03 38.22 72.11 38.17 72.19 39.19 72.28 39.29 72.36 39.28 72.44 39.38 72.53 39.06 72.61 38.72 72.69 38.78 72.78 38.59 72.86 39.56 72.94 39 73.03 38.61 73.11 38.33 73.19 38.32 73.28 39.2 73.36 39.45 73.44 39.8 73.53 40.08 73.61 40 73.69 39.82 73.77 39.73 73.86 39.81 73.94 39.81 74.02 39.84 74.11 39.75 74.19 39.9 74.27 40 74.36 40.38 74.44 40.19 74.52 40.4 74.61 40.78 74.69 41.05 74.77 41.39 74.86 41.27 74.94 40.45 75.02 40.48 75.11 40.68 75.19 40.55 75.27 40.37 75.35 40.7 75.44 40.43 75.52 41.06 75.6 41.15 75.69 41.33 75.77 41.48 75.85 41.93 75.94 41.34 76.02 41.89 76.1 41.94 76.19 43.02 76.27 43.48 76.35 44.02 76.44 44.05 76.52 43.91 76.6 43.67 76.69 43.68 76.77 43.8 76.85 43.75 76.93 43.46 77.02 43.08 77.1 43.2 77.18 43.15 77.27 42.9 77.35 42.64 77.43 43.69 77.52 44.39 77.6 44.04 77.68 43.48 77.77 43.7 77.85 43.71 77.93 43.53 78.02 42.36 78.1 42.78 78.18 42.93 78.27 42.55 78.35 42.24 78.43 41.9 78.51 41.37 78.6 40.82 78.68 40.69 78.76 40.54 78.85 39.78 78.93 39.6 79.01 39.78 79.1 39.72 79.18 39.89 79.26 39.94 79.35 40.16 79.43 40.46 79.51 40.95 79.6 40.62 79.68 40.89 79.76 41.97 79.85 42.19 79.93 42.09 80.01 42.55 80.09 42.05 80.18 42.44 80.26 41.98 80.34 41.59 80.43 41.45 80.51 41.05 80.59 41.19 80.68 40.73 80.76 40.9 80.84 40.54 80.93 40.94 81.01 40.77 81.09 40.74 81.18 41.18 81.26 40.85 81.34 40.86 81.43 41.04 81.51 41.41 81.59 41.2 81.67 40.56 81.76 39.95 81.84 40.48 81.92 40.67 82.01 41.07 82.09 41.15 82.17 41.12 82.26 41.3 82.34 41.04 82.42 40.97 82.51 41.15 82.59 42.04 82.67 41.24 82.76 41.81 82.84 42.1 82.92 42.21 83.01 42.32 83.09 42.4 83.17 42.52 83.26 42.52 83.34 42.46 83.42 42.26 83.5 42.06 83.59 42.17 83.67 42.26 83.75 41.48 83.84 41.36 83.92 41.39 84 41.02 84.09 41.02 84.17 41.41 84.25 41.4 84.34 40.96 84.42 40.3 84.5 39.71 84.59 39.46 84.67 39.46 84.75 39.1 84.84 38.59 84.92 37.54 85 37.8 85.08 38.09 85.17 38.24 85.25 38.2 85.33 37.67 85.42 37.8 85.5 37.81 85.58 37.82 85.67 38.07 85.75 37.98 85.83 38.7 85.92 38.93 86 38.5 86.08 39.11 86.17 39.07 86.25 38.57 86.33 38.29 86.42 38.33 86.5 38.31 86.58 38.9 86.66 39.27 86.75 38.83 86.83 39.36 86.91 39.46 87 39.34 87.08 38.92 87.16 39.03 87.25 39.22 87.33 39.14 87.41 39.96 87.5 39.34 87.58 39.67 87.66 39.42 87.75 39.55 87.83 39.78 87.91 40.21 88 39.85 88.08 40.53 88.16 40.55 88.24 40.38 88.33 40.71 88.41 40.29 88.49 39.9 88.58 40.22 88.66 40.9 88.74 41.44 88.83 41.71 88.91 40.78 88.99 40.52 89.08 40.08 89.16 40.14 89.24 41.05 89.33 40.93 89.41 42.23 89.49 41.93 89.58 42.33 89.66 42.61 89.74 42.73 89.82 41.71 89.91 40.53 89.99 40.58 90.07 40.48 90.16 40.48 90.24 39.77 90.32 39.88 90.41 39.29 90.49 38.73 90.57 38.46 90.66 39.17 90.74 38.64 90.82 38.59 90.91 39.21 90.99 39.28 91.07 38.92 91.16 39 91.24 39.45 91.32 39.32 91.4 37.54 91.49 37.42 91.57 37.16 91.65 37.29 91.74 37.69 91.82 37.07 91.9 36.8 91.99 37.53 92.07 37.57 92.15 38.03 92.24 37.86 92.32 37.66 92.4 37.92 92.49 38.39 92.57 38.03 92.65 38.39 92.74 38.93 92.82 38.37 92.9 38.03 92.99 38.45 93.07 38.41 93.15 38.47 93.23 38.08 93.32 37.83 93.4 38.1 93.48 37.56 93.57 37.59 93.65 37.32 93.73 37.97 93.82 37.7 93.9 37.91 93.98 37.32 94.07 37.82 94.15 36.84 94.23 37.7 94.32 37.82 94.4 37.09 94.48 36.74 94.57 36.75 94.65 35.99 94.73 37.1 94.81 37.29 94.9 37.74 94.98 37.94 95.06 37.2 95.15 36.83 95.23 35.86 95.31 35.58 95.4 35.69 95.48 35.53 95.56 35.68 95.65 36.21 95.73 36.18 95.81 35.88 95.9 35.9 95.98 35.52 96.06 35.27 96.15 35.04 96.23 35.87 96.31 36.74 96.39 36.25 96.48 35.82 96.56 35.57 96.64 36.7 96.73 36.35 96.81 35.73 96.89 35.82 96.98 36.32 97.06 36.15 97.14 35.85 97.23 34.77 97.31 34.5 97.39 34.53 97.48 34.74 97.56 35.19 97.64 35.8 97.73 36.45 97.81 36.46 97.89 36.33 97.97 37.19 98.06 37.63 98.14 37.94 98.22 38.96 98.31 38.56 98.39 39.21 98.47 39.02 98.56 39.13 98.64 38.91 98.72 39.07 98.81 39.14 98.89 38.69 98.97 38.14 99.06 38.24 99.14 37.49 99.22 37.44 99.31 37.17 99.39 37.34 99.47 37.48 99.55 37.7 99.64 37 99.72 37.67 99.8 38.12 99.89 37.06 99.97 36.87 100.05 36.6 100.14 36.03 100.22 35.86 100.3 35.89 100.39 35.93 100.47 35.94 100.55 36.78 100.64 36.61 100.72 36.16 100.8 35.45 100.89 34.97 100.97 33.9 101.05 33.04 101.13 33.5 101.22 34.45 101.3 35.03 101.38 35.19 101.47 34.8 101.55 34.92 101.63 35.69 101.72 35.9 101.8 34.54 101.88 35.3 101.97 35.44 102.05 34.88 102.13 34.34 102.22 33.34 102.3 33.63 102.38 34.11 102.47 33.64 102.55 33.94 102.63 34.24 102.72 33.63 102.8 34.15 102.88 34.21 102.96 33.56 103.05 33.13 103.13 32.28 103.21 31.78 103.3 31.5 103.38 30.43 103.46 30.09 103.55 29.62 103.63 29.33 103.71 28.94 103.8 29.48 103.88 29.98 103.96 29.42 104.05 29.61 104.13 30.27 104.21 31.26 104.3 31.09 104.38 31.76 104.46 32.2 104.54 32.52 104.63 32.58 104.71 33.08 104.79 33.51 104.88 33.51 104.96 33.87 105.04 33.81 105.13 34.09 105.21 34.01 105.29 33.56 105.38 33.06 105.46 33.35 105.54 32.84 105.63 32.08 105.71 31.47 105.79 30.91 105.88 30.99 105.96 31.24 106.04 31.26 106.12 31.74 106.21 32.18 106.29 31.67 106.37 31.94 106.46 31.25 106.54 30.49 106.62 29.74 106.71 29.11 106.79 28.57 106.87 28.83 106.96 28.55 107.04 28.51 107.12 28.46 107.21 28.93 107.29 29.13 107.37 29.3 107.46 28.98 107.54 29.12 107.62 29.64 107.7 29.37 107.79 29.3 107.87 28.78 107.95 28.98 108.04 28.86 108.12 28.6 108.2 28.79 108.29 29.07 108.37 28.62 108.45 28.31 108.54 28.34 108.62 27.43 108.7 27.45 108.79 28.43 108.87 29.2 108.95 28.99 109.04 29 109.12 29.17 109.2 28.95 109.28 28.3 109.37 27.72 109.45 28.82 109.53 28.9 109.62 28.98 109.7 28.84 109.78 27.88 109.87 27.9 109.95 28.05 110.03 27.58 110.12 28 110.2 28.5 110.28 29.1 110.37 29.49 110.45 29.18 110.53 29.81 110.62 29.4 110.7 28.92 110.78 30.13 110.86 29.79 110.95 29.84 111.03 29.89 111.11 30.05 111.2 29.13 111.28 27.82 111.36 27.74 111.45 27.81 111.53 27.43 111.61 27.2 111.7 27.66 111.78 27.48 111.86 27.27 111.95 26.56 112.03 26.08 112.11 26.73 112.2 26.97 112.28 26.62 112.36 26.09 112.45 26.5 112.53 26.52 112.61 26.66 112.69 26.39 112.78 25.9 112.86 26.17 112.94 26.61 113.03 27.93 113.11 28.71 113.19 27.94 113.28 29.11 113.36 28.95 113.44 29.77 113.53 28.91 113.61 29.68 113.69 28.78 113.78 29.78 113.86 29.87 113.94 29.5 114.03 30.03 114.11 30.32 114.19 30.56 114.27 30.2 114.36 29.51 114.44 30.28 114.52 29.3 114.61 28.42 114.69 28.71 114.77 28.82 114.86 29.67 114.94 29.37 115.02 29.96 115.11 30.4 115.19 30.34 115.27 29.83 115.36 29.79 115.44 29.11 115.52 29.09 115.61 28.87 115.69 29.25 115.77 29.8 115.85 29.74 115.94 29.07 116.02 28.98 116.1 29.49 116.19 29.23 116.27 29.07 116.35 29.4 116.44 29.74 116.52 29.8 116.6 30.1 116.69 28.99 116.77 29.21 116.85 29.57 116.94 29.74 117.02 29.82 117.1 29.72 117.19 28.72 117.27 28.46 117.35 28.94 117.43 28.42 117.52 28.24 117.6 28.46 117.68 28.68 117.77 29.24 117.85 29.7 117.93 29.34 118.02 28.83 118.1 28.49 118.18 29 118.27 28.11 118.35 27.86 118.43 28.34 118.52 27.5 118.6 26.75 118.68 26.99 118.77 27.64 118.85 27.21 118.93 26.69 119.01 26.03 119.1 24.71 119.18 25.53 119.26 25.87 119.35 25.78 119.43 25.88 119.51 26.88 119.6 26.56 119.68 26.08 119.76 25.81 119.85 25.64 119.93 26.75 120.01 26.43 120.1 26.06 120.18 26.94 120.26 26.16 120.35 26.79 120.43 26.57 120.51 27.03 120.59 26.63 120.68 27.22 120.76 28.43 120.84 28.61 120.93 28.76 121.01 29.04 121.09 28.82 121.18 28.32 121.26 28.29 121.34 28.64 121.43 29.2 121.51 29.36 121.59 29.48 121.68 28.5 121.76 28.75 121.84 29.53 121.93 29.67 122.01 29.62 122.09 29.21 122.18 28.63 122.26 29.53 122.34 29.52 122.42 30.52 122.51 30 122.59 30.15 122.67 30.3 122.76 31.04 122.84 30.76 122.92 30.37 123.01 30.75 123.09 30.95 123.17 31.23 123.26 31.22 123.34 31.11 123.42 30.44 123.51 30.94 123.59 31.69 123.67 32.2 123.76 31.62 123.84 31.14 123.92 31.78 124 32.42 124.09 33.08 124.17 33.16 124.25 32.62 124.34 32.62 124.42 32.09 124.5 32.12 124.59 31.82 124.67 32 124.75 31.76 124.84 31.67 124.92 32.02 125 31.5 125.09 32.2 125.17 30.81 125.25 30.75 125.34 30.05 125.42 28.78 125.5 28.05 125.58 27.86" class="geometry color_" stroke="#BECAB9"/>
        <path fill="none" d="M21.63,44.35 L 21.71 44.35 21.8 43.74 21.88 43.65 21.96 43.55 22.05 43.53 22.13 43.48 22.21 43.34 22.3 43.42 22.38 42.99 22.46 43.42 22.55 43.26 22.63 42.72 22.71 42.52 22.8 42.45 22.88 42.2 22.96 41.9 23.05 42.03 23.13 41.74 23.21 40.93 23.29 41.8 23.38 41.73 23.46 41.32 23.54 41.26 23.63 41.24 23.71 41.61 23.79 41.82 23.88 42.12 23.96 42.48 24.04 42.39 24.13 42.55 24.21 42.85 24.29 42.94 24.38 43.28 24.46 44.25 24.54 44.07 24.63 43.81 24.71 43.95 24.79 44.35 24.88 44.34 24.96 43.9 25.04 42.94 25.12 43.17 25.21 43.09 25.29 43.5 25.37 43.31 25.46 43.37 25.54 43.79 25.62 44.1 25.71 43.4 25.79 43.16 25.87 43.35 25.96 43.82 26.04 44.32 26.12 43.9 26.21 43.35 26.29 43.07 26.37 42.86 26.46 42.48 26.54 42.39 26.62 42.27 26.7 42.26 26.79 42.41 26.87 42.84 26.95 43.64 27.04 43.77 27.12 43.72 27.2 43.87 27.29 44.33 27.37 43.69 27.45 43.82 27.54 43.42 27.62 43.14 27.7 42.85 27.79 43.09 27.87 43.28 27.95 43.24 28.04 42.77 28.12 42.57 28.2 43.06 28.28 43.36 28.37 43.36 28.45 43.18 28.53 43.23 28.62 42.55 28.7 42.91 28.78 42.69 28.87 42.83 28.95 42.57 29.03 42.66 29.12 42.78 29.2 43.36 29.28 42.75 29.37 42.61 29.45 42.73 29.53 43.07 29.62 43.23 29.7 43.52 29.78 43.55 29.86 43.29 29.95 43.6 30.03 44.28 30.11 44.4 30.2 44.17 30.28 44.19 30.36 44.46 30.45 44.68 30.53 44.58 30.61 44.14 30.7 44.28 30.78 43.85 30.86 42.86 30.95 43.22 31.03 43.44 31.11 42.78 31.2 42.41 31.28 41.94 31.36 41.98 31.44 41.46 31.53 42.23 31.61 42.36 31.69 42.53 31.78 42.73 31.86 43.1 31.94 42.85 32.03 42.78 32.11 43.12 32.19 43.35 32.28 43.37 32.36 43.11 32.44 42.83 32.53 42.47 32.61 42.44 32.69 42.25 32.78 42.73 32.86 43.08 32.94 43.28 33.02 43.34 33.11 42.7 33.19 42.5 33.27 42.82 33.36 42.45 33.44 41.39 33.52 41.09 33.61 42.05 33.69 41.77 33.77 41.49 33.86 41.16 33.94 41.24 34.02 41.03 34.11 40.76 34.19 40.98 34.27 41.11 34.36 40.6 34.44 40.64 34.52 41.1 34.61 40.88 34.69 39.94 34.77 40.43 34.85 40.07 34.94 39.94 35.02 40.09 35.1 40.09 35.19 40.02 35.27 40.6 35.35 40.71 35.44 40.81 35.52 40.88 35.6 41.81 35.69 41.85 35.77 41.71 35.85 41.85 35.94 41.51 36.02 41.73 36.1 41.45 36.19 41.32 36.27 41.15 36.35 40.68 36.43 40.34 36.52 39.65 36.6 39.76 36.68 39.43 36.77 39.64 36.85 39.41 36.93 39.28 37.02 38.36 37.1 37.89 37.18 38.34 37.27 38.25 37.35 38.46 37.43 38.69 37.52 38.26 37.6 37.79 37.68 37.8 37.77 38.29 37.85 38.27 37.93 37.75 38.01 38.48 38.1 38.55 38.18 37.69 38.26 37.39 38.35 37.15 38.43 36.61 38.51 37.45 38.6 36.8 38.68 37.37 38.76 37.02 38.85 37.54 38.93 37.53 39.01 37.87 39.1 38.01 39.18 38.35 39.26 38.12 39.35 37.33 39.43 37.75 39.51 37.68 39.59 37.6 39.68 37.32 39.76 37.2 39.84 36.54 39.93 36.08 40.01 36.39 40.09 36.62 40.18 36.62 40.26 36.83 40.34 36.61 40.43 36.3 40.51 36.14 40.59 35.95 40.68 36.27 40.76 36.02 40.84 35.85 40.93 35.42 41.01 36.18 41.09 35.98 41.17 36.06 41.26 35.71 41.34 35.6 41.42 35.93 41.51 36.32 41.59 36.32 41.67 36.62 41.76 36.83 41.84 37.02 41.92 36.31 42.01 36.28 42.09 35.81 42.17 35.62 42.26 36.13 42.34 36.63 42.42 36.29 42.51 36.29 42.59 36.46 42.67 36.57 42.75 36.53 42.84 36.3 42.92 36.3 43 37.02 43.09 37.46 43.17 37.84 43.25 37.67 43.34 37.2 43.42 36.97 43.5 37.06 43.59 36.97 43.67 37.52 43.75 36.95 43.84 36.58 43.92 36.44 44 36.07 44.09 35.77 44.17 35.57 44.25 36.24 44.34 35.75 44.42 35.32 44.5 34.88 44.58 35.21 44.67 35.19 44.75 35.09 44.83 35.01 44.92 34.85 45 34.56 45.08 34.38 45.17 34.3 45.25 34.75 45.33 34.88 45.42 34.07 45.5 34.54 45.58 35.13 45.67 36.08 45.75 36.43 45.83 36.41 45.92 36.41 46 37.04 46.08 37.36 46.16 36.67 46.25 35.93 46.33 35.44 46.41 36.53 46.5 36.38 46.58 36.1 46.66 36.02 46.75 36.11 46.83 35.66 46.91 34.86 47 34.65 47.08 35.22 47.16 34.94 47.25 35.43 47.33 35.26 47.41 35.15 47.5 34.63 47.58 35.04 47.66 35.03 47.74 35.05 47.83 35.2 47.91 35.16 47.99 35.35 48.08 35.44 48.16 35.27 48.24 35.27 48.33 35.38 48.41 35.19 48.49 35.23 48.58 34.07 48.66 33.4 48.74 34.21 48.83 34.12 48.91 34.42 48.99 34.92 49.08 34.56 49.16 34.75 49.24 34.77 49.32 34.03 49.41 34.11 49.49 34.48 49.57 33.73 49.66 33.54 49.74 33.17 49.82 32.8 49.91 33.39 49.99 33.53 50.07 33.66 50.16 33.64 50.24 33.26 50.32 33.32 50.41 33.22 50.49 32.92 50.57 33.42 50.66 33.36 50.74 33.09 50.82 33.46 50.9 33.43 50.99 33.43 51.07 34.22 51.15 34.21 51.24 34.4 51.32 34.53 51.4 35.21 51.49 35.44 51.57 34.45 51.65 34.73 51.74 34.65 51.82 34.92 51.9 35.13 51.99 35.39 52.07 34.54 52.15 34.76 52.24 34.65 52.32 34.17 52.4 33.63 52.48 34.19 52.57 34.09 52.65 33.58 52.73 33.61 52.82 33.84 52.9 33.15 52.98 32.78 53.07 32.53 53.15 33.33 53.23 31.97 53.32 31.43 53.4 30.68 53.48 30.53 53.57 29.54 53.65 29.73 53.73 30.31 53.82 29.91 53.9 30.29 53.98 29.88 54.07 29.58 54.15 29.21 54.23 29.35 54.31 28.81 54.4 28.85 54.48 29.34 54.56 29.04 54.65 29.06 54.73 29.12 54.81 28.93 54.9 28.83 54.98 29.21 55.06 28.9 55.15 28.46 55.23 28.68 55.31 28.93 55.4 29.25 55.48 28.99 55.56 28.63 55.65 28.99 55.73 28.36 55.81 27.85 55.89 29.36 55.98 28.4 56.06 28.82 56.14 27.79 56.23 27.41 56.31 27.83 56.39 27.63 56.48 28.28 56.56 28.62 56.64 29.51 56.73 29.85 56.81 30.05 56.89 29.55 56.98 29.31 57.06 28.7 57.14 28.14 57.23 28.85 57.31 28.7 57.39 28.57 57.47 28.16 57.56 28.12 57.64 28.77 57.72 28.82 57.81 28.48 57.89 29.09 57.97 28.31 58.06 28.1 58.14 28.02 58.22 28.09 58.31 28.38 58.39 28.31 58.47 28.63 58.56 28.43 58.64 29.14 58.72 29.47 58.81 28.94 58.89 28.65 58.97 28.92 59.05 28.4 59.14 28.36 59.22 29.05 59.3 29.08 59.39 28.55 59.47 28.12 59.55 28.32 59.64 27.71 59.72 27.01 59.8 26.81 59.89 26.82 59.97 27.09 60.05 26.97 60.14 27.83 60.22 28.05 60.3 27.61 60.39 27.37 60.47 26.75 60.55 26.28 60.63 25.33 60.72 25.23 60.8 24.76 60.88 25 60.97 24.48 61.05 24.78 61.13 26 61.22 26.34 61.3 26.18 61.38 26.87 61.47 26.5 61.55 26.33 61.63 25.57 61.72 26.62 61.8 25.9 61.88 26.12 61.97 26.4 62.05 26.64 62.13 27.4 62.21 26.34 62.3 26.33 62.38 26.1 62.46 26.11 62.55 26.75 62.63 26.56 62.71 26.44 62.8 26.17 62.88 26.26 62.96 26.73 63.05 26.26 63.13 26.03 63.21 26.17 63.3 26.17 63.38 25.99 63.46 25.64 63.55 26.1 63.63 26.43 63.71 26.08 63.8 25.94 63.88 26.32 63.96 26.46 64.04 26.26 64.13 26.64 64.21 26.73 64.29 26.74 64.38 26.82 64.46 26.85 64.54 27.15 64.63 27.57 64.71 27.67 64.79 28.08 64.88 28.29 64.96 28.48 65.04 28.09 65.13 27.8 65.21 27.69 65.29 26.69 65.38 26.76 65.46 26.56 65.54 27.62 65.62 27.48 65.71 28.95 65.79 28.84 65.87 29.38 65.96 28.94 66.04 29.2 66.12 28.19 66.21 27.98 66.29 28.01 66.37 26.72 66.46 26.72 66.54 26.06 66.62 27.35 66.71 27.79 66.79 27.17 66.87 27.32 66.96 28.12 67.04 27.66 67.12 27.99 67.2 28.08 67.29 27.89 67.37 27.35 67.45 26.61 67.54 27.2 67.62 28.25 67.7 28.87 67.79 29.61 67.87 28.77 67.95 29.01 68.04 29.83 68.12 29.84 68.2 29.38 68.29 30.07 68.37 29.96 68.45 29.26 68.54 30.17 68.62 30 68.7 30.86 68.78 30.75 68.87 30.53 68.95 30.23 69.03 29.8 69.12 29.71 69.2 30.1 69.28 29.8 69.37 31.25 69.45 31.72 69.53 30.72 69.62 31.13 69.7 31.04 69.78 31.47 69.87 31.74 69.95 31.02 70.03 31.47 70.12 31.6 70.2 31.66 70.28 31.9 70.36 31.49 70.45 31.23 70.53 31.45 70.61 31.48 70.7 31.74 70.78 32.11 70.86 31.58 70.95 31.47 71.03 30.88 71.11 30.32 71.2 31.17 71.28 31.11 71.36 31.12 71.45 32 71.53 31.47 71.61 31.96 71.7 32.4 71.78 31.85 71.86 31.65 71.94 31.48 72.03 32.25 72.11 32.21 72.19 32.4 72.28 32.12 72.36 32.06 72.44 31.78 72.53 32.43 72.61 32.66 72.69 31.77 72.78 32.17 72.86 32.61 72.94 33.15 73.03 33.44 73.11 33.4 73.19 32.55 73.28 32.24 73.36 32.73 73.44 32.81 73.53 32.97 73.61 32.52 73.69 32.61 73.77 32.19 73.86 32.43 73.94 32.35 74.02 33.11 74.11 32.83 74.19 33.01 74.27 33.21 74.36 32.91 74.44 33.74 74.52 33.95 74.61 34.11 74.69 34.15 74.77 33.96 74.86 33.72 74.94 33.23 75.02 33.58 75.11 33.65 75.19 33.51 75.27 32.86 75.35 32.68 75.44 32.81 75.52 32.7 75.6 32.41 75.69 31.99 75.77 32.04 75.85 32.51 75.94 32.76 76.02 33.44 76.1 33.97 76.19 34.32 76.27 34.12 76.35 34.94 76.44 34.83 76.52 35.07 76.6 34.65 76.69 35.13 76.77 34.11 76.85 34.72 76.93 35.38 77.02 34.14 77.1 34.13 77.18 34.65 77.27 34.46 77.35 35.21 77.43 34.93 77.52 34.68 77.6 34.17 77.68 33.39 77.77 33.81 77.85 33.9 77.93 33.8 78.02 33.35 78.1 33.58 78.18 32.75 78.27 31.84 78.35 31.16 78.43 31.68 78.51 32.13 78.6 31.69 78.68 31.9 78.76 31.86 78.85 32.26 78.93 32.5 79.01 32.51 79.1 32.36 79.18 32.51 79.26 32.73 79.35 33.67 79.43 33.29 79.51 34.28 79.6 34.56 79.68 35.3 79.76 35.32 79.85 34.6 79.93 34.58 80.01 35.32 80.09 35.54 80.18 35.19 80.26 35.11 80.34 35.81 80.43 35.98 80.51 35.97 80.59 36.01 80.68 35.98 80.76 36.17 80.84 36.22 80.93 36.23 81.01 36.06 81.09 36.02 81.18 36.93 81.26 36.35 81.34 36.94 81.43 36.61 81.51 36.29 81.59 35.59 81.67 35.3 81.76 36.15 81.84 35.71 81.92 35.52 82.01 36.27 82.09 37.53 82.17 37.81 82.26 38.23 82.34 38.64 82.42 39.09 82.51 38.65 82.59 39.51 82.67 39.88 82.76 40.37 82.84 40.4 82.92 41.56 83.01 41.46 83.09 41.82 83.17 41.57 83.26 41.39 83.34 41.58 83.42 41.57 83.5 41.17 83.59 41.5 83.67 40.81 83.75 40.5 83.84 40.57 83.92 40.13 84 39.79 84.09 39.79 84.17 39.79 84.25 39.83 84.34 39.67 84.42 38.94 84.5 38.97 84.59 38.12 84.67 37.79 84.75 38.35 84.84 38.18 84.92 38.06 85 38.76 85.08 38.89 85.17 39.36 85.25 39.06 85.33 39.44 85.42 39.38 85.5 39.23 85.58 38.94 85.67 38.78 85.75 39.09 85.83 38.96 85.92 39.2 86 38.71 86.08 38.34 86.17 37.88 86.25 37.77 86.33 38.13 86.42 37.99 86.5 39.02 86.58 38.7 86.66 38.08 86.75 37.79 86.83 37.52 86.91 38.05 87 38.01 87.08 37.87 87.16 37.66 87.25 37 87.33 37.11 87.41 37.1 87.5 36.76 87.58 36.03 87.66 35.74 87.75 36.31 87.83 36.76 87.91 37.5 88 37.23 88.08 36.62 88.16 36.28 88.24 35.92 88.33 36.16 88.41 36.81 88.49 36.75 88.58 36.84 88.66 36.84 88.74 36.05 88.83 36.09 88.91 35.35 88.99 35.32 89.08 35.25 89.16 35.4 89.24 35.57 89.33 35.68 89.41 35.76 89.49 34.84 89.58 34.61 89.66 34.75 89.74 35.23 89.82 35.52 89.91 35.7 89.99 35.99 90.07 36.27 90.16 35.74 90.24 35.17 90.32 34.85 90.41 35.36 90.49 35.34 90.57 35.87 90.66 35.34 90.74 35.39 90.82 34.76 90.91 34.94 90.99 34.24 91.07 34.55 91.16 34.32 91.24 34.7 91.32 34.68 91.4 34.6 91.49 33.76 91.57 33.83 91.65 34.1 91.74 33.5 91.82 32.87 91.9 32.53 91.99 31.56 92.07 31.73 92.15 32.89 92.24 32.68 92.32 32.62 92.4 32.29 92.49 32.03 92.57 31.96 92.65 32.19 92.74 32.25 92.82 32.77 92.9 32.6 92.99 32.89 93.07 32.53 93.15 32.46 93.23 33.45 93.32 33.94 93.4 34.23 93.48 33.71 93.57 34.15 93.65 34.3 93.73 34.27 93.82 33.52 93.9 33.59 93.98 33.88 94.07 33.68 94.15 34.56 94.23 33.9 94.32 34.23 94.4 34.43 94.48 34.6 94.57 35.37 94.65 34.45 94.73 34.16 94.81 34.47 94.9 34.39 94.98 34.21 95.06 34.01 95.15 33.82 95.23 33.69 95.31 32.73 95.4 32.95 95.48 32.85 95.56 32.98 95.65 32.59 95.73 32.67 95.81 33.87 95.9 33.42 95.98 32.58 96.06 32.77 96.15 32.41 96.23 32.36 96.31 31.87 96.39 32.01 96.48 31.99 96.56 32.22 96.64 32.17 96.73 31.91 96.81 31.85 96.89 32.13 96.98 32.2 97.06 31.52 97.14 31.39 97.23 30.87 97.31 31.24 97.39 31.31 97.48 31.96 97.56 31.57 97.64 32.11 97.73 31.5 97.81 30.71 97.89 30.86 97.97 30.48 98.06 31.09 98.14 30.39 98.22 30.98 98.31 29.99 98.39 30.09 98.47 29.11 98.56 28.74 98.64 28.02 98.72 27.96 98.81 28.39 98.89 28.56 98.97 27.87 99.06 27.16 99.14 27.33 99.22 27.41 99.31 27.55 99.39 26.86 99.47 27.6 99.55 27.33 99.64 27.52 99.72 27.22 99.8 26.98 99.89 27.76 99.97 28.05 100.05 27.57 100.14 27.32 100.22 27.54 100.3 27.55 100.39 28.54 100.47 28.63 100.55 28.91 100.64 28.74 100.72 28.71 100.8 28.4 100.89 29.41 100.97 29.44 101.05 30.37 101.13 29.63 101.22 29.65 101.3 29.59 101.38 29.65 101.47 29.52 101.55 29.62 101.63 30.03 101.72 30.73 101.8 31.5 101.88 31.41 101.97 30.97 102.05 31.5 102.13 32.01 102.22 31.33 102.3 31.23 102.38 31.66 102.47 31.87 102.55 31.92 102.63 31.39 102.72 31.96 102.8 32.18 102.88 31.82 102.96 31.86 103.05 32.54 103.13 32.74 103.21 33.35 103.3 33.24 103.38 33.6 103.46 32.58 103.55 32.49 103.63 32.22 103.71 32.52 103.8 32.35 103.88 32.21 103.96 32.81 104.05 32.74 104.13 32.4 104.21 32.95 104.3 33.66 104.38 33.46 104.46 34.08 104.54 34.02 104.63 34.02 104.71 33.65 104.79 33.99 104.88 33.99 104.96 33.21 105.04 32.14 105.13 32.35 105.21 33.11 105.29 33.04 105.38 32.52 105.46 32.77 105.54 33.3 105.63 33.27 105.71 33.15 105.79 33.64 105.88 33.6 105.96 33.73 106.04 33.64 106.12 33.33 106.21 31.86 106.29 32.4 106.37 31.29 106.46 30.82 106.54 29.88 106.62 29.85 106.71 29.89 106.79 30.56 106.87 30.56 106.96 30.33 107.04 30.39 107.12 30.57 107.21 30.02 107.29 29.79 107.37 29.18 107.46 28.38 107.54 28.75 107.62 29.27 107.7 29.59 107.79 28.91 107.87 28.36 107.95 28.17 108.04 28.23 108.12 28.75 108.2 27.91 108.29 27.51 108.37 26.91 108.45 26.37 108.54 26.44 108.62 27.6 108.7 29.24 108.79 29.48 108.87 29.88 108.95 30.15 109.04 29.23 109.12 29.24 109.2 28.76 109.28 28.87 109.37 28.69 109.45 29.25 109.53 27.91 109.62 27.37 109.7 27.22 109.78 27.37 109.87 26.45 109.95 26.25 110.03 26.35 110.12 26.71 110.2 27.6 110.28 28.55 110.37 29.26 110.45 30.2 110.53 29.86 110.62 30.14 110.7 30.1 110.78 30.75 110.86 30.77 110.95 30.72 111.03 31.28 111.11 30.9 111.2 30.74 111.28 31.58 111.36 32.47 111.45 32.77 111.53 33.45 111.61 33.58 111.7 33.65 111.78 33.71 111.86 34.03 111.95 33.28 112.03 32.82 112.11 33.34 112.2 33.32 112.28 33.62 112.36 33.27 112.45 32.74 112.53 32.87 112.61 33.12 112.69 32.9 112.78 32.82 112.86 32.65 112.94 32.39 113.03 31.97 113.11 32.3 113.19 33.04 113.28 33.1 113.36 33.45 113.44 33.69 113.53 33.9 113.61 34.24 113.69 33.99 113.78 34.16 113.86 33.99 113.94 32.94 114.03 33.35 114.11 33.28 114.19 33.9 114.27 33.45 114.36 33.15 114.44 32.95 114.52 33.4 114.61 33.02 114.69 32.74 114.77 32.99 114.86 31.67 114.94 31.46 115.02 31.62 115.11 31.65 115.19 32.1 115.27 31.78 115.36 31.89 115.44 32.09 115.52 31.74 115.61 31.49 115.69 31.43 115.77 30.97 115.85 30.68 115.94 30.18 116.02 30.61 116.1 30.7 116.19 30.59 116.27 30.96 116.35 30.93 116.44 31.79 116.52 32.58 116.6 32.22 116.69 31.7 116.77 31.95 116.85 31.87 116.94 32.14 117.02 31.97 117.1 32.67 117.19 31.43 117.27 31.03 117.35 30.51 117.43 30.57 117.52 31.76 117.6 31.69 117.68 31.93 117.77 32.54 117.85 33.34 117.93 33.76 118.02 34.79 118.1 35.38 118.18 35.01 118.27 35.01 118.35 34.6 118.43 35.18 118.52 35.88 118.6 36.65 118.68 36.38 118.77 35.73 118.85 35.67 118.93 35.41 119.01 35.11 119.1 35.73 119.18 34.79 119.26 35.11 119.35 35.56 119.43 35.94 119.51 37.02 119.6 37.22 119.68 37.39 119.76 36.73 119.85 36.23 119.93 35.98 120.01 36.23 120.1 36.25 120.18 35.78 120.26 35.42 120.35 35.24 120.43 35.82 120.51 35.09 120.59 33.92 120.68 33.08 120.76 32.81 120.84 32.9 120.93 33.45 121.01 33.33 121.09 34.63 121.18 34.79 121.26 34.74 121.34 34.4 121.43 33.99 121.51 34.63 121.59 34.08 121.68 33.94 121.76 34.11 121.84 33.85 121.93 33.41 122.01 33.51 122.09 33.25 122.18 33.34 122.26 32.93 122.34 33.74 122.42 33.3 122.51 33.57 122.59 34.23 122.67 33.63 122.76 33.96 122.84 34.27 122.92 34.12 123.01 34.17 123.09 34.69 123.17 34.8 123.26 34.38 123.34 33.94 123.42 33.85 123.51 33.58 123.59 32.59 123.67 32.48 123.76 31.93 123.84 32.49 123.92 31.62 124 31.98 124.09 31.5 124.17 31.97 124.25 31.23 124.34 32.02 124.42 31.91 124.5 32.66 124.59 33.19 124.67 32.7 124.75 33.16 124.84 33.68 124.92 33.16 125 33.29 125.09 32.91 125.17 32.72 125.25 32.4 125.34 32.56 125.42 32.6 125.5 33.28 125.58 33.62" class="geometry color_" stroke="#D2B497"/>
      </g>
    </g>
    <g opacity="0" class="guide zoomslider" stroke="#000000" stroke-opacity="0.000" id="fig-0378e04b897742b597befd2e8e1c169e-element-15">
      <g fill="#EAEAEA" stroke-width="0.3" stroke-opacity="0" stroke="#6A6A6A" id="fig-0378e04b897742b597befd2e8e1c169e-element-16">
        <rect x="120.58" y="8" width="4" height="4"/>
        <g class="button_logo" fill="#6A6A6A" id="fig-0378e04b897742b597befd2e8e1c169e-element-17">
          <path d="M121.38,9.6 L 122.18 9.6 122.18 8.8 122.98 8.8 122.98 9.6 123.78 9.6 123.78 10.4 122.98 10.4 122.98 11.2 122.18 11.2 122.18 10.4 121.38 10.4 z"/>
        </g>
      </g>
      <g fill="#EAEAEA" id="fig-0378e04b897742b597befd2e8e1c169e-element-18">
        <rect x="101.08" y="8" width="19" height="4"/>
      </g>
      <g class="zoomslider_thumb" fill="#6A6A6A" id="fig-0378e04b897742b597befd2e8e1c169e-element-19">
        <rect x="109.58" y="8" width="2" height="4"/>
      </g>
      <g fill="#EAEAEA" stroke-width="0.3" stroke-opacity="0" stroke="#6A6A6A" id="fig-0378e04b897742b597befd2e8e1c169e-element-20">
        <rect x="96.58" y="8" width="4" height="4"/>
        <g class="button_logo" fill="#6A6A6A" id="fig-0378e04b897742b597befd2e8e1c169e-element-21">
          <path d="M97.38,9.6 L 99.78 9.6 99.78 10.4 97.38 10.4 z"/>
        </g>
      </g>
    </g>
  </g>
  <g class="guide ylabels" font-size="2.82" font-family="'PT Sans Caption','Helvetica Neue','Helvetica',sans-serif" fill="#6C606B" id="fig-0378e04b897742b597befd2e8e1c169e-element-22">
    <text x="18.63" y="178.87" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">-250</text>
    <text x="18.63" y="159.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">-200</text>
    <text x="18.63" y="140.68" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">-150</text>
    <text x="18.63" y="121.58" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">-100</text>
    <text x="18.63" y="102.49" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">-50</text>
    <text x="18.63" y="83.39" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">0</text>
    <text x="18.63" y="64.29" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">50</text>
    <text x="18.63" y="45.19" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">100</text>
    <text x="18.63" y="26.1" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">150</text>
    <text x="18.63" y="7" text-anchor="end" dy="0.35em" visibility="visible" gadfly:scale="1.0">200</text>
    <text x="18.63" y="-12.1" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">250</text>
    <text x="18.63" y="-31.19" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">300</text>
    <text x="18.63" y="-50.29" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">350</text>
    <text x="18.63" y="-69.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">400</text>
    <text x="18.63" y="-88.49" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="1.0">450</text>
    <text x="18.63" y="159.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-200</text>
    <text x="18.63" y="155.96" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-190</text>
    <text x="18.63" y="152.14" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-180</text>
    <text x="18.63" y="148.32" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-170</text>
    <text x="18.63" y="144.5" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-160</text>
    <text x="18.63" y="140.68" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-150</text>
    <text x="18.63" y="136.86" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-140</text>
    <text x="18.63" y="133.04" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-130</text>
    <text x="18.63" y="129.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-120</text>
    <text x="18.63" y="125.4" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-110</text>
    <text x="18.63" y="121.58" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-100</text>
    <text x="18.63" y="117.76" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-90</text>
    <text x="18.63" y="113.94" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-80</text>
    <text x="18.63" y="110.12" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-70</text>
    <text x="18.63" y="106.3" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-60</text>
    <text x="18.63" y="102.49" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-50</text>
    <text x="18.63" y="98.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-40</text>
    <text x="18.63" y="94.85" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-30</text>
    <text x="18.63" y="91.03" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-20</text>
    <text x="18.63" y="87.21" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">-10</text>
    <text x="18.63" y="83.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">0</text>
    <text x="18.63" y="79.57" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">10</text>
    <text x="18.63" y="75.75" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">20</text>
    <text x="18.63" y="71.93" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">30</text>
    <text x="18.63" y="68.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">40</text>
    <text x="18.63" y="64.29" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">50</text>
    <text x="18.63" y="60.47" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">60</text>
    <text x="18.63" y="56.65" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">70</text>
    <text x="18.63" y="52.83" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">80</text>
    <text x="18.63" y="49.01" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">90</text>
    <text x="18.63" y="45.19" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">100</text>
    <text x="18.63" y="41.37" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">110</text>
    <text x="18.63" y="37.56" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">120</text>
    <text x="18.63" y="33.74" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">130</text>
    <text x="18.63" y="29.92" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">140</text>
    <text x="18.63" y="26.1" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">150</text>
    <text x="18.63" y="22.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">160</text>
    <text x="18.63" y="18.46" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">170</text>
    <text x="18.63" y="14.64" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">180</text>
    <text x="18.63" y="10.82" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">190</text>
    <text x="18.63" y="7" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">200</text>
    <text x="18.63" y="3.18" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">210</text>
    <text x="18.63" y="-0.64" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">220</text>
    <text x="18.63" y="-4.46" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">230</text>
    <text x="18.63" y="-8.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">240</text>
    <text x="18.63" y="-12.1" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">250</text>
    <text x="18.63" y="-15.92" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">260</text>
    <text x="18.63" y="-19.74" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">270</text>
    <text x="18.63" y="-23.56" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">280</text>
    <text x="18.63" y="-27.37" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">290</text>
    <text x="18.63" y="-31.19" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">300</text>
    <text x="18.63" y="-35.01" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">310</text>
    <text x="18.63" y="-38.83" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">320</text>
    <text x="18.63" y="-42.65" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">330</text>
    <text x="18.63" y="-46.47" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">340</text>
    <text x="18.63" y="-50.29" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">350</text>
    <text x="18.63" y="-54.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">360</text>
    <text x="18.63" y="-57.93" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">370</text>
    <text x="18.63" y="-61.75" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">380</text>
    <text x="18.63" y="-65.57" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">390</text>
    <text x="18.63" y="-69.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="10.0">400</text>
    <text x="18.63" y="159.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="0.5">-200</text>
    <text x="18.63" y="83.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="0.5">0</text>
    <text x="18.63" y="7" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="0.5">200</text>
    <text x="18.63" y="-69.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="0.5">400</text>
    <text x="18.63" y="159.78" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-200</text>
    <text x="18.63" y="152.14" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-180</text>
    <text x="18.63" y="144.5" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-160</text>
    <text x="18.63" y="136.86" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-140</text>
    <text x="18.63" y="129.22" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-120</text>
    <text x="18.63" y="121.58" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-100</text>
    <text x="18.63" y="113.94" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-80</text>
    <text x="18.63" y="106.3" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-60</text>
    <text x="18.63" y="98.67" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-40</text>
    <text x="18.63" y="91.03" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">-20</text>
    <text x="18.63" y="83.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">0</text>
    <text x="18.63" y="75.75" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">20</text>
    <text x="18.63" y="68.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">40</text>
    <text x="18.63" y="60.47" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">60</text>
    <text x="18.63" y="52.83" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">80</text>
    <text x="18.63" y="45.19" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">100</text>
    <text x="18.63" y="37.56" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">120</text>
    <text x="18.63" y="29.92" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">140</text>
    <text x="18.63" y="22.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">160</text>
    <text x="18.63" y="14.64" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">180</text>
    <text x="18.63" y="7" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">200</text>
    <text x="18.63" y="-0.64" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">220</text>
    <text x="18.63" y="-8.28" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">240</text>
    <text x="18.63" y="-15.92" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">260</text>
    <text x="18.63" y="-23.56" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">280</text>
    <text x="18.63" y="-31.19" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">300</text>
    <text x="18.63" y="-38.83" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">320</text>
    <text x="18.63" y="-46.47" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">340</text>
    <text x="18.63" y="-54.11" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">360</text>
    <text x="18.63" y="-61.75" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">380</text>
    <text x="18.63" y="-69.39" text-anchor="end" dy="0.35em" visibility="hidden" gadfly:scale="5.0">400</text>
  </g>
  <g font-size="3.88" font-family="'PT Sans','Helvetica Neue','Helvetica',sans-serif" fill="#564A55" stroke="#000000" stroke-opacity="0.000" id="fig-0378e04b897742b597befd2e8e1c169e-element-23">
    <text x="8.81" y="43.19" text-anchor="middle" dy="0.35em" transform="rotate(-90, 8.81, 45.19)">Value</text>
  </g>
</g>
<defs>
<clipPath id="fig-0378e04b897742b597befd2e8e1c169e-element-9">
  <path d="M19.63,5 L 127.58 5 127.58 85.39 19.63 85.39" />
</clipPath
></defs>
<script> <![CDATA[
(function(N){var k=/[\.\/]/,L=/\s*,\s*/,C=function(a,d){return a-d},a,v,y={n:{}},M=function(){for(var a=0,d=this.length;a<d;a++)if("undefined"!=typeof this[a])return this[a]},A=function(){for(var a=this.length;--a;)if("undefined"!=typeof this[a])return this[a]},w=function(k,d){k=String(k);var f=v,n=Array.prototype.slice.call(arguments,2),u=w.listeners(k),p=0,b,q=[],e={},l=[],r=a;l.firstDefined=M;l.lastDefined=A;a=k;for(var s=v=0,x=u.length;s<x;s++)"zIndex"in u[s]&&(q.push(u[s].zIndex),0>u[s].zIndex&&
(e[u[s].zIndex]=u[s]));for(q.sort(C);0>q[p];)if(b=e[q[p++] ],l.push(b.apply(d,n)),v)return v=f,l;for(s=0;s<x;s++)if(b=u[s],"zIndex"in b)if(b.zIndex==q[p]){l.push(b.apply(d,n));if(v)break;do if(p++,(b=e[q[p] ])&&l.push(b.apply(d,n)),v)break;while(b)}else e[b.zIndex]=b;else if(l.push(b.apply(d,n)),v)break;v=f;a=r;return l};w._events=y;w.listeners=function(a){a=a.split(k);var d=y,f,n,u,p,b,q,e,l=[d],r=[];u=0;for(p=a.length;u<p;u++){e=[];b=0;for(q=l.length;b<q;b++)for(d=l[b].n,f=[d[a[u] ],d["*"] ],n=2;n--;)if(d=
f[n])e.push(d),r=r.concat(d.f||[]);l=e}return r};w.on=function(a,d){a=String(a);if("function"!=typeof d)return function(){};for(var f=a.split(L),n=0,u=f.length;n<u;n++)(function(a){a=a.split(k);for(var b=y,f,e=0,l=a.length;e<l;e++)b=b.n,b=b.hasOwnProperty(a[e])&&b[a[e] ]||(b[a[e] ]={n:{}});b.f=b.f||[];e=0;for(l=b.f.length;e<l;e++)if(b.f[e]==d){f=!0;break}!f&&b.f.push(d)})(f[n]);return function(a){+a==+a&&(d.zIndex=+a)}};w.f=function(a){var d=[].slice.call(arguments,1);return function(){w.apply(null,
[a,null].concat(d).concat([].slice.call(arguments,0)))}};w.stop=function(){v=1};w.nt=function(k){return k?(new RegExp("(?:\\.|\\/|^)"+k+"(?:\\.|\\/|$)")).test(a):a};w.nts=function(){return a.split(k)};w.off=w.unbind=function(a,d){if(a){var f=a.split(L);if(1<f.length)for(var n=0,u=f.length;n<u;n++)w.off(f[n],d);else{for(var f=a.split(k),p,b,q,e,l=[y],n=0,u=f.length;n<u;n++)for(e=0;e<l.length;e+=q.length-2){q=[e,1];p=l[e].n;if("*"!=f[n])p[f[n] ]&&q.push(p[f[n] ]);else for(b in p)p.hasOwnProperty(b)&&
q.push(p[b]);l.splice.apply(l,q)}n=0;for(u=l.length;n<u;n++)for(p=l[n];p.n;){if(d){if(p.f){e=0;for(f=p.f.length;e<f;e++)if(p.f[e]==d){p.f.splice(e,1);break}!p.f.length&&delete p.f}for(b in p.n)if(p.n.hasOwnProperty(b)&&p.n[b].f){q=p.n[b].f;e=0;for(f=q.length;e<f;e++)if(q[e]==d){q.splice(e,1);break}!q.length&&delete p.n[b].f}}else for(b in delete p.f,p.n)p.n.hasOwnProperty(b)&&p.n[b].f&&delete p.n[b].f;p=p.n}}}else w._events=y={n:{}}};w.once=function(a,d){var f=function(){w.unbind(a,f);return d.apply(this,
arguments)};return w.on(a,f)};w.version="0.4.2";w.toString=function(){return"You are running Eve 0.4.2"};"undefined"!=typeof module&&module.exports?module.exports=w:"function"===typeof define&&define.amd?define("eve",[],function(){return w}):N.eve=w})(this);
(function(N,k){"function"===typeof define&&define.amd?define("Snap.svg",["eve"],function(L){return k(N,L)}):k(N,N.eve)})(this,function(N,k){var L=function(a){var k={},y=N.requestAnimationFrame||N.webkitRequestAnimationFrame||N.mozRequestAnimationFrame||N.oRequestAnimationFrame||N.msRequestAnimationFrame||function(a){setTimeout(a,16)},M=Array.isArray||function(a){return a instanceof Array||"[object Array]"==Object.prototype.toString.call(a)},A=0,w="M"+(+new Date).toString(36),z=function(a){if(null==
a)return this.s;var b=this.s-a;this.b+=this.dur*b;this.B+=this.dur*b;this.s=a},d=function(a){if(null==a)return this.spd;this.spd=a},f=function(a){if(null==a)return this.dur;this.s=this.s*a/this.dur;this.dur=a},n=function(){delete k[this.id];this.update();a("mina.stop."+this.id,this)},u=function(){this.pdif||(delete k[this.id],this.update(),this.pdif=this.get()-this.b)},p=function(){this.pdif&&(this.b=this.get()-this.pdif,delete this.pdif,k[this.id]=this)},b=function(){var a;if(M(this.start)){a=[];
for(var b=0,e=this.start.length;b<e;b++)a[b]=+this.start[b]+(this.end[b]-this.start[b])*this.easing(this.s)}else a=+this.start+(this.end-this.start)*this.easing(this.s);this.set(a)},q=function(){var l=0,b;for(b in k)if(k.hasOwnProperty(b)){var e=k[b],f=e.get();l++;e.s=(f-e.b)/(e.dur/e.spd);1<=e.s&&(delete k[b],e.s=1,l--,function(b){setTimeout(function(){a("mina.finish."+b.id,b)})}(e));e.update()}l&&y(q)},e=function(a,r,s,x,G,h,J){a={id:w+(A++).toString(36),start:a,end:r,b:s,s:0,dur:x-s,spd:1,get:G,
set:h,easing:J||e.linear,status:z,speed:d,duration:f,stop:n,pause:u,resume:p,update:b};k[a.id]=a;r=0;for(var K in k)if(k.hasOwnProperty(K)&&(r++,2==r))break;1==r&&y(q);return a};e.time=Date.now||function(){return+new Date};e.getById=function(a){return k[a]||null};e.linear=function(a){return a};e.easeout=function(a){return Math.pow(a,1.7)};e.easein=function(a){return Math.pow(a,0.48)};e.easeinout=function(a){if(1==a)return 1;if(0==a)return 0;var b=0.48-a/1.04,e=Math.sqrt(0.1734+b*b);a=e-b;a=Math.pow(Math.abs(a),
1/3)*(0>a?-1:1);b=-e-b;b=Math.pow(Math.abs(b),1/3)*(0>b?-1:1);a=a+b+0.5;return 3*(1-a)*a*a+a*a*a};e.backin=function(a){return 1==a?1:a*a*(2.70158*a-1.70158)};e.backout=function(a){if(0==a)return 0;a-=1;return a*a*(2.70158*a+1.70158)+1};e.elastic=function(a){return a==!!a?a:Math.pow(2,-10*a)*Math.sin(2*(a-0.075)*Math.PI/0.3)+1};e.bounce=function(a){a<1/2.75?a*=7.5625*a:a<2/2.75?(a-=1.5/2.75,a=7.5625*a*a+0.75):a<2.5/2.75?(a-=2.25/2.75,a=7.5625*a*a+0.9375):(a-=2.625/2.75,a=7.5625*a*a+0.984375);return a};
return N.mina=e}("undefined"==typeof k?function(){}:k),C=function(){function a(c,t){if(c){if(c.tagName)return x(c);if(y(c,"array")&&a.set)return a.set.apply(a,c);if(c instanceof e)return c;if(null==t)return c=G.doc.querySelector(c),x(c)}return new s(null==c?"100%":c,null==t?"100%":t)}function v(c,a){if(a){"#text"==c&&(c=G.doc.createTextNode(a.text||""));"string"==typeof c&&(c=v(c));if("string"==typeof a)return"xlink:"==a.substring(0,6)?c.getAttributeNS(m,a.substring(6)):"xml:"==a.substring(0,4)?c.getAttributeNS(la,
a.substring(4)):c.getAttribute(a);for(var da in a)if(a[h](da)){var b=J(a[da]);b?"xlink:"==da.substring(0,6)?c.setAttributeNS(m,da.substring(6),b):"xml:"==da.substring(0,4)?c.setAttributeNS(la,da.substring(4),b):c.setAttribute(da,b):c.removeAttribute(da)}}else c=G.doc.createElementNS(la,c);return c}function y(c,a){a=J.prototype.toLowerCase.call(a);return"finite"==a?isFinite(c):"array"==a&&(c instanceof Array||Array.isArray&&Array.isArray(c))?!0:"null"==a&&null===c||a==typeof c&&null!==c||"object"==
a&&c===Object(c)||$.call(c).slice(8,-1).toLowerCase()==a}function M(c){if("function"==typeof c||Object(c)!==c)return c;var a=new c.constructor,b;for(b in c)c[h](b)&&(a[b]=M(c[b]));return a}function A(c,a,b){function m(){var e=Array.prototype.slice.call(arguments,0),f=e.join("\u2400"),d=m.cache=m.cache||{},l=m.count=m.count||[];if(d[h](f)){a:for(var e=l,l=f,B=0,H=e.length;B<H;B++)if(e[B]===l){e.push(e.splice(B,1)[0]);break a}return b?b(d[f]):d[f]}1E3<=l.length&&delete d[l.shift()];l.push(f);d[f]=c.apply(a,
e);return b?b(d[f]):d[f]}return m}function w(c,a,b,m,e,f){return null==e?(c-=b,a-=m,c||a?(180*I.atan2(-a,-c)/C+540)%360:0):w(c,a,e,f)-w(b,m,e,f)}function z(c){return c%360*C/180}function d(c){var a=[];c=c.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g,function(c,b,m){m=m.split(/\s*,\s*|\s+/);"rotate"==b&&1==m.length&&m.push(0,0);"scale"==b&&(2<m.length?m=m.slice(0,2):2==m.length&&m.push(0,0),1==m.length&&m.push(m[0],0,0));"skewX"==b?a.push(["m",1,0,I.tan(z(m[0])),1,0,0]):"skewY"==b?a.push(["m",1,I.tan(z(m[0])),
0,1,0,0]):a.push([b.charAt(0)].concat(m));return c});return a}function f(c,t){var b=O(c),m=new a.Matrix;if(b)for(var e=0,f=b.length;e<f;e++){var h=b[e],d=h.length,B=J(h[0]).toLowerCase(),H=h[0]!=B,l=H?m.invert():0,E;"t"==B&&2==d?m.translate(h[1],0):"t"==B&&3==d?H?(d=l.x(0,0),B=l.y(0,0),H=l.x(h[1],h[2]),l=l.y(h[1],h[2]),m.translate(H-d,l-B)):m.translate(h[1],h[2]):"r"==B?2==d?(E=E||t,m.rotate(h[1],E.x+E.width/2,E.y+E.height/2)):4==d&&(H?(H=l.x(h[2],h[3]),l=l.y(h[2],h[3]),m.rotate(h[1],H,l)):m.rotate(h[1],
h[2],h[3])):"s"==B?2==d||3==d?(E=E||t,m.scale(h[1],h[d-1],E.x+E.width/2,E.y+E.height/2)):4==d?H?(H=l.x(h[2],h[3]),l=l.y(h[2],h[3]),m.scale(h[1],h[1],H,l)):m.scale(h[1],h[1],h[2],h[3]):5==d&&(H?(H=l.x(h[3],h[4]),l=l.y(h[3],h[4]),m.scale(h[1],h[2],H,l)):m.scale(h[1],h[2],h[3],h[4])):"m"==B&&7==d&&m.add(h[1],h[2],h[3],h[4],h[5],h[6])}return m}function n(c,t){if(null==t){var m=!0;t="linearGradient"==c.type||"radialGradient"==c.type?c.node.getAttribute("gradientTransform"):"pattern"==c.type?c.node.getAttribute("patternTransform"):
c.node.getAttribute("transform");if(!t)return new a.Matrix;t=d(t)}else t=a._.rgTransform.test(t)?J(t).replace(/\.{3}|\u2026/g,c._.transform||aa):d(t),y(t,"array")&&(t=a.path?a.path.toString.call(t):J(t)),c._.transform=t;var b=f(t,c.getBBox(1));if(m)return b;c.matrix=b}function u(c){c=c.node.ownerSVGElement&&x(c.node.ownerSVGElement)||c.node.parentNode&&x(c.node.parentNode)||a.select("svg")||a(0,0);var t=c.select("defs"),t=null==t?!1:t.node;t||(t=r("defs",c.node).node);return t}function p(c){return c.node.ownerSVGElement&&
x(c.node.ownerSVGElement)||a.select("svg")}function b(c,a,m){function b(c){if(null==c)return aa;if(c==+c)return c;v(B,{width:c});try{return B.getBBox().width}catch(a){return 0}}function h(c){if(null==c)return aa;if(c==+c)return c;v(B,{height:c});try{return B.getBBox().height}catch(a){return 0}}function e(b,B){null==a?d[b]=B(c.attr(b)||0):b==a&&(d=B(null==m?c.attr(b)||0:m))}var f=p(c).node,d={},B=f.querySelector(".svg---mgr");B||(B=v("rect"),v(B,{x:-9E9,y:-9E9,width:10,height:10,"class":"svg---mgr",
fill:"none"}),f.appendChild(B));switch(c.type){case "rect":e("rx",b),e("ry",h);case "image":e("width",b),e("height",h);case "text":e("x",b);e("y",h);break;case "circle":e("cx",b);e("cy",h);e("r",b);break;case "ellipse":e("cx",b);e("cy",h);e("rx",b);e("ry",h);break;case "line":e("x1",b);e("x2",b);e("y1",h);e("y2",h);break;case "marker":e("refX",b);e("markerWidth",b);e("refY",h);e("markerHeight",h);break;case "radialGradient":e("fx",b);e("fy",h);break;case "tspan":e("dx",b);e("dy",h);break;default:e(a,
b)}f.removeChild(B);return d}function q(c){y(c,"array")||(c=Array.prototype.slice.call(arguments,0));for(var a=0,b=0,m=this.node;this[a];)delete this[a++];for(a=0;a<c.length;a++)"set"==c[a].type?c[a].forEach(function(c){m.appendChild(c.node)}):m.appendChild(c[a].node);for(var h=m.childNodes,a=0;a<h.length;a++)this[b++]=x(h[a]);return this}function e(c){if(c.snap in E)return E[c.snap];var a=this.id=V(),b;try{b=c.ownerSVGElement}catch(m){}this.node=c;b&&(this.paper=new s(b));this.type=c.tagName;this.anims=
{};this._={transform:[]};c.snap=a;E[a]=this;"g"==this.type&&(this.add=q);if(this.type in{g:1,mask:1,pattern:1})for(var e in s.prototype)s.prototype[h](e)&&(this[e]=s.prototype[e])}function l(c){this.node=c}function r(c,a){var b=v(c);a.appendChild(b);return x(b)}function s(c,a){var b,m,f,d=s.prototype;if(c&&"svg"==c.tagName){if(c.snap in E)return E[c.snap];var l=c.ownerDocument;b=new e(c);m=c.getElementsByTagName("desc")[0];f=c.getElementsByTagName("defs")[0];m||(m=v("desc"),m.appendChild(l.createTextNode("Created with Snap")),
b.node.appendChild(m));f||(f=v("defs"),b.node.appendChild(f));b.defs=f;for(var ca in d)d[h](ca)&&(b[ca]=d[ca]);b.paper=b.root=b}else b=r("svg",G.doc.body),v(b.node,{height:a,version:1.1,width:c,xmlns:la});return b}function x(c){return!c||c instanceof e||c instanceof l?c:c.tagName&&"svg"==c.tagName.toLowerCase()?new s(c):c.tagName&&"object"==c.tagName.toLowerCase()&&"image/svg+xml"==c.type?new s(c.contentDocument.getElementsByTagName("svg")[0]):new e(c)}a.version="0.3.0";a.toString=function(){return"Snap v"+
this.version};a._={};var G={win:N,doc:N.document};a._.glob=G;var h="hasOwnProperty",J=String,K=parseFloat,U=parseInt,I=Math,P=I.max,Q=I.min,Y=I.abs,C=I.PI,aa="",$=Object.prototype.toString,F=/^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i;a._.separator=
RegExp("[,\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]+");var S=RegExp("[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*"),X={hs:1,rg:1},W=RegExp("([a-z])[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)",
"ig"),ma=RegExp("([rstm])[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)","ig"),Z=RegExp("(-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?)[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*",
"ig"),na=0,ba="S"+(+new Date).toString(36),V=function(){return ba+(na++).toString(36)},m="http://www.w3.org/1999/xlink",la="http://www.w3.org/2000/svg",E={},ca=a.url=function(c){return"url('#"+c+"')"};a._.$=v;a._.id=V;a.format=function(){var c=/\{([^\}]+)\}/g,a=/(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,b=function(c,b,m){var h=m;b.replace(a,function(c,a,b,m,t){a=a||m;h&&(a in h&&(h=h[a]),"function"==typeof h&&t&&(h=h()))});return h=(null==h||h==m?c:h)+""};return function(a,m){return J(a).replace(c,
function(c,a){return b(c,a,m)})}}();a._.clone=M;a._.cacher=A;a.rad=z;a.deg=function(c){return 180*c/C%360};a.angle=w;a.is=y;a.snapTo=function(c,a,b){b=y(b,"finite")?b:10;if(y(c,"array"))for(var m=c.length;m--;){if(Y(c[m]-a)<=b)return c[m]}else{c=+c;m=a%c;if(m<b)return a-m;if(m>c-b)return a-m+c}return a};a.getRGB=A(function(c){if(!c||(c=J(c)).indexOf("-")+1)return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:ka};if("none"==c)return{r:-1,g:-1,b:-1,hex:"none",toString:ka};!X[h](c.toLowerCase().substring(0,
2))&&"#"!=c.charAt()&&(c=T(c));if(!c)return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:ka};var b,m,e,f,d;if(c=c.match(F)){c[2]&&(e=U(c[2].substring(5),16),m=U(c[2].substring(3,5),16),b=U(c[2].substring(1,3),16));c[3]&&(e=U((d=c[3].charAt(3))+d,16),m=U((d=c[3].charAt(2))+d,16),b=U((d=c[3].charAt(1))+d,16));c[4]&&(d=c[4].split(S),b=K(d[0]),"%"==d[0].slice(-1)&&(b*=2.55),m=K(d[1]),"%"==d[1].slice(-1)&&(m*=2.55),e=K(d[2]),"%"==d[2].slice(-1)&&(e*=2.55),"rgba"==c[1].toLowerCase().slice(0,4)&&(f=K(d[3])),
d[3]&&"%"==d[3].slice(-1)&&(f/=100));if(c[5])return d=c[5].split(S),b=K(d[0]),"%"==d[0].slice(-1)&&(b/=100),m=K(d[1]),"%"==d[1].slice(-1)&&(m/=100),e=K(d[2]),"%"==d[2].slice(-1)&&(e/=100),"deg"!=d[0].slice(-3)&&"\u00b0"!=d[0].slice(-1)||(b/=360),"hsba"==c[1].toLowerCase().slice(0,4)&&(f=K(d[3])),d[3]&&"%"==d[3].slice(-1)&&(f/=100),a.hsb2rgb(b,m,e,f);if(c[6])return d=c[6].split(S),b=K(d[0]),"%"==d[0].slice(-1)&&(b/=100),m=K(d[1]),"%"==d[1].slice(-1)&&(m/=100),e=K(d[2]),"%"==d[2].slice(-1)&&(e/=100),
"deg"!=d[0].slice(-3)&&"\u00b0"!=d[0].slice(-1)||(b/=360),"hsla"==c[1].toLowerCase().slice(0,4)&&(f=K(d[3])),d[3]&&"%"==d[3].slice(-1)&&(f/=100),a.hsl2rgb(b,m,e,f);b=Q(I.round(b),255);m=Q(I.round(m),255);e=Q(I.round(e),255);f=Q(P(f,0),1);c={r:b,g:m,b:e,toString:ka};c.hex="#"+(16777216|e|m<<8|b<<16).toString(16).slice(1);c.opacity=y(f,"finite")?f:1;return c}return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:ka}},a);a.hsb=A(function(c,b,m){return a.hsb2rgb(c,b,m).hex});a.hsl=A(function(c,b,m){return a.hsl2rgb(c,
b,m).hex});a.rgb=A(function(c,a,b,m){if(y(m,"finite")){var e=I.round;return"rgba("+[e(c),e(a),e(b),+m.toFixed(2)]+")"}return"#"+(16777216|b|a<<8|c<<16).toString(16).slice(1)});var T=function(c){var a=G.doc.getElementsByTagName("head")[0]||G.doc.getElementsByTagName("svg")[0];T=A(function(c){if("red"==c.toLowerCase())return"rgb(255, 0, 0)";a.style.color="rgb(255, 0, 0)";a.style.color=c;c=G.doc.defaultView.getComputedStyle(a,aa).getPropertyValue("color");return"rgb(255, 0, 0)"==c?null:c});return T(c)},
qa=function(){return"hsb("+[this.h,this.s,this.b]+")"},ra=function(){return"hsl("+[this.h,this.s,this.l]+")"},ka=function(){return 1==this.opacity||null==this.opacity?this.hex:"rgba("+[this.r,this.g,this.b,this.opacity]+")"},D=function(c,b,m){null==b&&y(c,"object")&&"r"in c&&"g"in c&&"b"in c&&(m=c.b,b=c.g,c=c.r);null==b&&y(c,string)&&(m=a.getRGB(c),c=m.r,b=m.g,m=m.b);if(1<c||1<b||1<m)c/=255,b/=255,m/=255;return[c,b,m]},oa=function(c,b,m,e){c=I.round(255*c);b=I.round(255*b);m=I.round(255*m);c={r:c,
g:b,b:m,opacity:y(e,"finite")?e:1,hex:a.rgb(c,b,m),toString:ka};y(e,"finite")&&(c.opacity=e);return c};a.color=function(c){var b;y(c,"object")&&"h"in c&&"s"in c&&"b"in c?(b=a.hsb2rgb(c),c.r=b.r,c.g=b.g,c.b=b.b,c.opacity=1,c.hex=b.hex):y(c,"object")&&"h"in c&&"s"in c&&"l"in c?(b=a.hsl2rgb(c),c.r=b.r,c.g=b.g,c.b=b.b,c.opacity=1,c.hex=b.hex):(y(c,"string")&&(c=a.getRGB(c)),y(c,"object")&&"r"in c&&"g"in c&&"b"in c&&!("error"in c)?(b=a.rgb2hsl(c),c.h=b.h,c.s=b.s,c.l=b.l,b=a.rgb2hsb(c),c.v=b.b):(c={hex:"none"},
c.r=c.g=c.b=c.h=c.s=c.v=c.l=-1,c.error=1));c.toString=ka;return c};a.hsb2rgb=function(c,a,b,m){y(c,"object")&&"h"in c&&"s"in c&&"b"in c&&(b=c.b,a=c.s,c=c.h,m=c.o);var e,h,d;c=360*c%360/60;d=b*a;a=d*(1-Y(c%2-1));b=e=h=b-d;c=~~c;b+=[d,a,0,0,a,d][c];e+=[a,d,d,a,0,0][c];h+=[0,0,a,d,d,a][c];return oa(b,e,h,m)};a.hsl2rgb=function(c,a,b,m){y(c,"object")&&"h"in c&&"s"in c&&"l"in c&&(b=c.l,a=c.s,c=c.h);if(1<c||1<a||1<b)c/=360,a/=100,b/=100;var e,h,d;c=360*c%360/60;d=2*a*(0.5>b?b:1-b);a=d*(1-Y(c%2-1));b=e=
h=b-d/2;c=~~c;b+=[d,a,0,0,a,d][c];e+=[a,d,d,a,0,0][c];h+=[0,0,a,d,d,a][c];return oa(b,e,h,m)};a.rgb2hsb=function(c,a,b){b=D(c,a,b);c=b[0];a=b[1];b=b[2];var m,e;m=P(c,a,b);e=m-Q(c,a,b);c=((0==e?0:m==c?(a-b)/e:m==a?(b-c)/e+2:(c-a)/e+4)+360)%6*60/360;return{h:c,s:0==e?0:e/m,b:m,toString:qa}};a.rgb2hsl=function(c,a,b){b=D(c,a,b);c=b[0];a=b[1];b=b[2];var m,e,h;m=P(c,a,b);e=Q(c,a,b);h=m-e;c=((0==h?0:m==c?(a-b)/h:m==a?(b-c)/h+2:(c-a)/h+4)+360)%6*60/360;m=(m+e)/2;return{h:c,s:0==h?0:0.5>m?h/(2*m):h/(2-2*
m),l:m,toString:ra}};a.parsePathString=function(c){if(!c)return null;var b=a.path(c);if(b.arr)return a.path.clone(b.arr);var m={a:7,c:6,o:2,h:1,l:2,m:2,r:4,q:4,s:4,t:2,v:1,u:3,z:0},e=[];y(c,"array")&&y(c[0],"array")&&(e=a.path.clone(c));e.length||J(c).replace(W,function(c,a,b){var h=[];c=a.toLowerCase();b.replace(Z,function(c,a){a&&h.push(+a)});"m"==c&&2<h.length&&(e.push([a].concat(h.splice(0,2))),c="l",a="m"==a?"l":"L");"o"==c&&1==h.length&&e.push([a,h[0] ]);if("r"==c)e.push([a].concat(h));else for(;h.length>=
m[c]&&(e.push([a].concat(h.splice(0,m[c]))),m[c]););});e.toString=a.path.toString;b.arr=a.path.clone(e);return e};var O=a.parseTransformString=function(c){if(!c)return null;var b=[];y(c,"array")&&y(c[0],"array")&&(b=a.path.clone(c));b.length||J(c).replace(ma,function(c,a,m){var e=[];a.toLowerCase();m.replace(Z,function(c,a){a&&e.push(+a)});b.push([a].concat(e))});b.toString=a.path.toString;return b};a._.svgTransform2string=d;a._.rgTransform=RegExp("^[a-z][\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*-?\\.?\\d",
"i");a._.transform2matrix=f;a._unit2px=b;a._.getSomeDefs=u;a._.getSomeSVG=p;a.select=function(c){return x(G.doc.querySelector(c))};a.selectAll=function(c){c=G.doc.querySelectorAll(c);for(var b=(a.set||Array)(),m=0;m<c.length;m++)b.push(x(c[m]));return b};setInterval(function(){for(var c in E)if(E[h](c)){var a=E[c],b=a.node;("svg"!=a.type&&!b.ownerSVGElement||"svg"==a.type&&(!b.parentNode||"ownerSVGElement"in b.parentNode&&!b.ownerSVGElement))&&delete E[c]}},1E4);(function(c){function m(c){function a(c,
b){var m=v(c.node,b);(m=(m=m&&m.match(d))&&m[2])&&"#"==m.charAt()&&(m=m.substring(1))&&(f[m]=(f[m]||[]).concat(function(a){var m={};m[b]=ca(a);v(c.node,m)}))}function b(c){var a=v(c.node,"xlink:href");a&&"#"==a.charAt()&&(a=a.substring(1))&&(f[a]=(f[a]||[]).concat(function(a){c.attr("xlink:href","#"+a)}))}var e=c.selectAll("*"),h,d=/^\s*url\(("|'|)(.*)\1\)\s*$/;c=[];for(var f={},l=0,E=e.length;l<E;l++){h=e[l];a(h,"fill");a(h,"stroke");a(h,"filter");a(h,"mask");a(h,"clip-path");b(h);var t=v(h.node,
"id");t&&(v(h.node,{id:h.id}),c.push({old:t,id:h.id}))}l=0;for(E=c.length;l<E;l++)if(e=f[c[l].old])for(h=0,t=e.length;h<t;h++)e[h](c[l].id)}function e(c,a,b){return function(m){m=m.slice(c,a);1==m.length&&(m=m[0]);return b?b(m):m}}function d(c){return function(){var a=c?"<"+this.type:"",b=this.node.attributes,m=this.node.childNodes;if(c)for(var e=0,h=b.length;e<h;e++)a+=" "+b[e].name+'="'+b[e].value.replace(/"/g,'\\"')+'"';if(m.length){c&&(a+=">");e=0;for(h=m.length;e<h;e++)3==m[e].nodeType?a+=m[e].nodeValue:
1==m[e].nodeType&&(a+=x(m[e]).toString());c&&(a+="</"+this.type+">")}else c&&(a+="/>");return a}}c.attr=function(c,a){if(!c)return this;if(y(c,"string"))if(1<arguments.length){var b={};b[c]=a;c=b}else return k("snap.util.getattr."+c,this).firstDefined();for(var m in c)c[h](m)&&k("snap.util.attr."+m,this,c[m]);return this};c.getBBox=function(c){if(!a.Matrix||!a.path)return this.node.getBBox();var b=this,m=new a.Matrix;if(b.removed)return a._.box();for(;"use"==b.type;)if(c||(m=m.add(b.transform().localMatrix.translate(b.attr("x")||
0,b.attr("y")||0))),b.original)b=b.original;else var e=b.attr("xlink:href"),b=b.original=b.node.ownerDocument.getElementById(e.substring(e.indexOf("#")+1));var e=b._,h=a.path.get[b.type]||a.path.get.deflt;try{if(c)return e.bboxwt=h?a.path.getBBox(b.realPath=h(b)):a._.box(b.node.getBBox()),a._.box(e.bboxwt);b.realPath=h(b);b.matrix=b.transform().localMatrix;e.bbox=a.path.getBBox(a.path.map(b.realPath,m.add(b.matrix)));return a._.box(e.bbox)}catch(d){return a._.box()}};var f=function(){return this.string};
c.transform=function(c){var b=this._;if(null==c){var m=this;c=new a.Matrix(this.node.getCTM());for(var e=n(this),h=[e],d=new a.Matrix,l=e.toTransformString(),b=J(e)==J(this.matrix)?J(b.transform):l;"svg"!=m.type&&(m=m.parent());)h.push(n(m));for(m=h.length;m--;)d.add(h[m]);return{string:b,globalMatrix:c,totalMatrix:d,localMatrix:e,diffMatrix:c.clone().add(e.invert()),global:c.toTransformString(),total:d.toTransformString(),local:l,toString:f}}c instanceof a.Matrix?this.matrix=c:n(this,c);this.node&&
("linearGradient"==this.type||"radialGradient"==this.type?v(this.node,{gradientTransform:this.matrix}):"pattern"==this.type?v(this.node,{patternTransform:this.matrix}):v(this.node,{transform:this.matrix}));return this};c.parent=function(){return x(this.node.parentNode)};c.append=c.add=function(c){if(c){if("set"==c.type){var a=this;c.forEach(function(c){a.add(c)});return this}c=x(c);this.node.appendChild(c.node);c.paper=this.paper}return this};c.appendTo=function(c){c&&(c=x(c),c.append(this));return this};
c.prepend=function(c){if(c){if("set"==c.type){var a=this,b;c.forEach(function(c){b?b.after(c):a.prepend(c);b=c});return this}c=x(c);var m=c.parent();this.node.insertBefore(c.node,this.node.firstChild);this.add&&this.add();c.paper=this.paper;this.parent()&&this.parent().add();m&&m.add()}return this};c.prependTo=function(c){c=x(c);c.prepend(this);return this};c.before=function(c){if("set"==c.type){var a=this;c.forEach(function(c){var b=c.parent();a.node.parentNode.insertBefore(c.node,a.node);b&&b.add()});
this.parent().add();return this}c=x(c);var b=c.parent();this.node.parentNode.insertBefore(c.node,this.node);this.parent()&&this.parent().add();b&&b.add();c.paper=this.paper;return this};c.after=function(c){c=x(c);var a=c.parent();this.node.nextSibling?this.node.parentNode.insertBefore(c.node,this.node.nextSibling):this.node.parentNode.appendChild(c.node);this.parent()&&this.parent().add();a&&a.add();c.paper=this.paper;return this};c.insertBefore=function(c){c=x(c);var a=this.parent();c.node.parentNode.insertBefore(this.node,
c.node);this.paper=c.paper;a&&a.add();c.parent()&&c.parent().add();return this};c.insertAfter=function(c){c=x(c);var a=this.parent();c.node.parentNode.insertBefore(this.node,c.node.nextSibling);this.paper=c.paper;a&&a.add();c.parent()&&c.parent().add();return this};c.remove=function(){var c=this.parent();this.node.parentNode&&this.node.parentNode.removeChild(this.node);delete this.paper;this.removed=!0;c&&c.add();return this};c.select=function(c){return x(this.node.querySelector(c))};c.selectAll=
function(c){c=this.node.querySelectorAll(c);for(var b=(a.set||Array)(),m=0;m<c.length;m++)b.push(x(c[m]));return b};c.asPX=function(c,a){null==a&&(a=this.attr(c));return+b(this,c,a)};c.use=function(){var c,a=this.node.id;a||(a=this.id,v(this.node,{id:a}));c="linearGradient"==this.type||"radialGradient"==this.type||"pattern"==this.type?r(this.type,this.node.parentNode):r("use",this.node.parentNode);v(c.node,{"xlink:href":"#"+a});c.original=this;return c};var l=/\S+/g;c.addClass=function(c){var a=(c||
"").match(l)||[];c=this.node;var b=c.className.baseVal,m=b.match(l)||[],e,h,d;if(a.length){for(e=0;d=a[e++];)h=m.indexOf(d),~h||m.push(d);a=m.join(" ");b!=a&&(c.className.baseVal=a)}return this};c.removeClass=function(c){var a=(c||"").match(l)||[];c=this.node;var b=c.className.baseVal,m=b.match(l)||[],e,h;if(m.length){for(e=0;h=a[e++];)h=m.indexOf(h),~h&&m.splice(h,1);a=m.join(" ");b!=a&&(c.className.baseVal=a)}return this};c.hasClass=function(c){return!!~(this.node.className.baseVal.match(l)||[]).indexOf(c)};
c.toggleClass=function(c,a){if(null!=a)return a?this.addClass(c):this.removeClass(c);var b=(c||"").match(l)||[],m=this.node,e=m.className.baseVal,h=e.match(l)||[],d,f,E;for(d=0;E=b[d++];)f=h.indexOf(E),~f?h.splice(f,1):h.push(E);b=h.join(" ");e!=b&&(m.className.baseVal=b);return this};c.clone=function(){var c=x(this.node.cloneNode(!0));v(c.node,"id")&&v(c.node,{id:c.id});m(c);c.insertAfter(this);return c};c.toDefs=function(){u(this).appendChild(this.node);return this};c.pattern=c.toPattern=function(c,
a,b,m){var e=r("pattern",u(this));null==c&&(c=this.getBBox());y(c,"object")&&"x"in c&&(a=c.y,b=c.width,m=c.height,c=c.x);v(e.node,{x:c,y:a,width:b,height:m,patternUnits:"userSpaceOnUse",id:e.id,viewBox:[c,a,b,m].join(" ")});e.node.appendChild(this.node);return e};c.marker=function(c,a,b,m,e,h){var d=r("marker",u(this));null==c&&(c=this.getBBox());y(c,"object")&&"x"in c&&(a=c.y,b=c.width,m=c.height,e=c.refX||c.cx,h=c.refY||c.cy,c=c.x);v(d.node,{viewBox:[c,a,b,m].join(" "),markerWidth:b,markerHeight:m,
orient:"auto",refX:e||0,refY:h||0,id:d.id});d.node.appendChild(this.node);return d};var E=function(c,a,b,m){"function"!=typeof b||b.length||(m=b,b=L.linear);this.attr=c;this.dur=a;b&&(this.easing=b);m&&(this.callback=m)};a._.Animation=E;a.animation=function(c,a,b,m){return new E(c,a,b,m)};c.inAnim=function(){var c=[],a;for(a in this.anims)this.anims[h](a)&&function(a){c.push({anim:new E(a._attrs,a.dur,a.easing,a._callback),mina:a,curStatus:a.status(),status:function(c){return a.status(c)},stop:function(){a.stop()}})}(this.anims[a]);
return c};a.animate=function(c,a,b,m,e,h){"function"!=typeof e||e.length||(h=e,e=L.linear);var d=L.time();c=L(c,a,d,d+m,L.time,b,e);h&&k.once("mina.finish."+c.id,h);return c};c.stop=function(){for(var c=this.inAnim(),a=0,b=c.length;a<b;a++)c[a].stop();return this};c.animate=function(c,a,b,m){"function"!=typeof b||b.length||(m=b,b=L.linear);c instanceof E&&(m=c.callback,b=c.easing,a=b.dur,c=c.attr);var d=[],f=[],l={},t,ca,n,T=this,q;for(q in c)if(c[h](q)){T.equal?(n=T.equal(q,J(c[q])),t=n.from,ca=
n.to,n=n.f):(t=+T.attr(q),ca=+c[q]);var la=y(t,"array")?t.length:1;l[q]=e(d.length,d.length+la,n);d=d.concat(t);f=f.concat(ca)}t=L.time();var p=L(d,f,t,t+a,L.time,function(c){var a={},b;for(b in l)l[h](b)&&(a[b]=l[b](c));T.attr(a)},b);T.anims[p.id]=p;p._attrs=c;p._callback=m;k("snap.animcreated."+T.id,p);k.once("mina.finish."+p.id,function(){delete T.anims[p.id];m&&m.call(T)});k.once("mina.stop."+p.id,function(){delete T.anims[p.id]});return T};var T={};c.data=function(c,b){var m=T[this.id]=T[this.id]||
{};if(0==arguments.length)return k("snap.data.get."+this.id,this,m,null),m;if(1==arguments.length){if(a.is(c,"object")){for(var e in c)c[h](e)&&this.data(e,c[e]);return this}k("snap.data.get."+this.id,this,m[c],c);return m[c]}m[c]=b;k("snap.data.set."+this.id,this,b,c);return this};c.removeData=function(c){null==c?T[this.id]={}:T[this.id]&&delete T[this.id][c];return this};c.outerSVG=c.toString=d(1);c.innerSVG=d()})(e.prototype);a.parse=function(c){var a=G.doc.createDocumentFragment(),b=!0,m=G.doc.createElement("div");
c=J(c);c.match(/^\s*<\s*svg(?:\s|>)/)||(c="<svg>"+c+"</svg>",b=!1);m.innerHTML=c;if(c=m.getElementsByTagName("svg")[0])if(b)a=c;else for(;c.firstChild;)a.appendChild(c.firstChild);m.innerHTML=aa;return new l(a)};l.prototype.select=e.prototype.select;l.prototype.selectAll=e.prototype.selectAll;a.fragment=function(){for(var c=Array.prototype.slice.call(arguments,0),b=G.doc.createDocumentFragment(),m=0,e=c.length;m<e;m++){var h=c[m];h.node&&h.node.nodeType&&b.appendChild(h.node);h.nodeType&&b.appendChild(h);
"string"==typeof h&&b.appendChild(a.parse(h).node)}return new l(b)};a._.make=r;a._.wrap=x;s.prototype.el=function(c,a){var b=r(c,this.node);a&&b.attr(a);return b};k.on("snap.util.getattr",function(){var c=k.nt(),c=c.substring(c.lastIndexOf(".")+1),a=c.replace(/[A-Z]/g,function(c){return"-"+c.toLowerCase()});return pa[h](a)?this.node.ownerDocument.defaultView.getComputedStyle(this.node,null).getPropertyValue(a):v(this.node,c)});var pa={"alignment-baseline":0,"baseline-shift":0,clip:0,"clip-path":0,
"clip-rule":0,color:0,"color-interpolation":0,"color-interpolation-filters":0,"color-profile":0,"color-rendering":0,cursor:0,direction:0,display:0,"dominant-baseline":0,"enable-background":0,fill:0,"fill-opacity":0,"fill-rule":0,filter:0,"flood-color":0,"flood-opacity":0,font:0,"font-family":0,"font-size":0,"font-size-adjust":0,"font-stretch":0,"font-style":0,"font-variant":0,"font-weight":0,"glyph-orientation-horizontal":0,"glyph-orientation-vertical":0,"image-rendering":0,kerning:0,"letter-spacing":0,
"lighting-color":0,marker:0,"marker-end":0,"marker-mid":0,"marker-start":0,mask:0,opacity:0,overflow:0,"pointer-events":0,"shape-rendering":0,"stop-color":0,"stop-opacity":0,stroke:0,"stroke-dasharray":0,"stroke-dashoffset":0,"stroke-linecap":0,"stroke-linejoin":0,"stroke-miterlimit":0,"stroke-opacity":0,"stroke-width":0,"text-anchor":0,"text-decoration":0,"text-rendering":0,"unicode-bidi":0,visibility:0,"word-spacing":0,"writing-mode":0};k.on("snap.util.attr",function(c){var a=k.nt(),b={},a=a.substring(a.lastIndexOf(".")+
1);b[a]=c;var m=a.replace(/-(\w)/gi,function(c,a){return a.toUpperCase()}),a=a.replace(/[A-Z]/g,function(c){return"-"+c.toLowerCase()});pa[h](a)?this.node.style[m]=null==c?aa:c:v(this.node,b)});a.ajax=function(c,a,b,m){var e=new XMLHttpRequest,h=V();if(e){if(y(a,"function"))m=b,b=a,a=null;else if(y(a,"object")){var d=[],f;for(f in a)a.hasOwnProperty(f)&&d.push(encodeURIComponent(f)+"="+encodeURIComponent(a[f]));a=d.join("&")}e.open(a?"POST":"GET",c,!0);a&&(e.setRequestHeader("X-Requested-With","XMLHttpRequest"),
e.setRequestHeader("Content-type","application/x-www-form-urlencoded"));b&&(k.once("snap.ajax."+h+".0",b),k.once("snap.ajax."+h+".200",b),k.once("snap.ajax."+h+".304",b));e.onreadystatechange=function(){4==e.readyState&&k("snap.ajax."+h+"."+e.status,m,e)};if(4==e.readyState)return e;e.send(a);return e}};a.load=function(c,b,m){a.ajax(c,function(c){c=a.parse(c.responseText);m?b.call(m,c):b(c)})};a.getElementByPoint=function(c,a){var b,m,e=G.doc.elementFromPoint(c,a);if(G.win.opera&&"svg"==e.tagName){b=
e;m=b.getBoundingClientRect();b=b.ownerDocument;var h=b.body,d=b.documentElement;b=m.top+(g.win.pageYOffset||d.scrollTop||h.scrollTop)-(d.clientTop||h.clientTop||0);m=m.left+(g.win.pageXOffset||d.scrollLeft||h.scrollLeft)-(d.clientLeft||h.clientLeft||0);h=e.createSVGRect();h.x=c-m;h.y=a-b;h.width=h.height=1;b=e.getIntersectionList(h,null);b.length&&(e=b[b.length-1])}return e?x(e):null};a.plugin=function(c){c(a,e,s,G,l)};return G.win.Snap=a}();C.plugin(function(a,k,y,M,A){function w(a,d,f,b,q,e){null==
d&&"[object SVGMatrix]"==z.call(a)?(this.a=a.a,this.b=a.b,this.c=a.c,this.d=a.d,this.e=a.e,this.f=a.f):null!=a?(this.a=+a,this.b=+d,this.c=+f,this.d=+b,this.e=+q,this.f=+e):(this.a=1,this.c=this.b=0,this.d=1,this.f=this.e=0)}var z=Object.prototype.toString,d=String,f=Math;(function(n){function k(a){return a[0]*a[0]+a[1]*a[1]}function p(a){var d=f.sqrt(k(a));a[0]&&(a[0]/=d);a[1]&&(a[1]/=d)}n.add=function(a,d,e,f,n,p){var k=[[],[],[] ],u=[[this.a,this.c,this.e],[this.b,this.d,this.f],[0,0,1] ];d=[[a,
e,n],[d,f,p],[0,0,1] ];a&&a instanceof w&&(d=[[a.a,a.c,a.e],[a.b,a.d,a.f],[0,0,1] ]);for(a=0;3>a;a++)for(e=0;3>e;e++){for(f=n=0;3>f;f++)n+=u[a][f]*d[f][e];k[a][e]=n}this.a=k[0][0];this.b=k[1][0];this.c=k[0][1];this.d=k[1][1];this.e=k[0][2];this.f=k[1][2];return this};n.invert=function(){var a=this.a*this.d-this.b*this.c;return new w(this.d/a,-this.b/a,-this.c/a,this.a/a,(this.c*this.f-this.d*this.e)/a,(this.b*this.e-this.a*this.f)/a)};n.clone=function(){return new w(this.a,this.b,this.c,this.d,this.e,
this.f)};n.translate=function(a,d){return this.add(1,0,0,1,a,d)};n.scale=function(a,d,e,f){null==d&&(d=a);(e||f)&&this.add(1,0,0,1,e,f);this.add(a,0,0,d,0,0);(e||f)&&this.add(1,0,0,1,-e,-f);return this};n.rotate=function(b,d,e){b=a.rad(b);d=d||0;e=e||0;var l=+f.cos(b).toFixed(9);b=+f.sin(b).toFixed(9);this.add(l,b,-b,l,d,e);return this.add(1,0,0,1,-d,-e)};n.x=function(a,d){return a*this.a+d*this.c+this.e};n.y=function(a,d){return a*this.b+d*this.d+this.f};n.get=function(a){return+this[d.fromCharCode(97+
a)].toFixed(4)};n.toString=function(){return"matrix("+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)].join()+")"};n.offset=function(){return[this.e.toFixed(4),this.f.toFixed(4)]};n.determinant=function(){return this.a*this.d-this.b*this.c};n.split=function(){var b={};b.dx=this.e;b.dy=this.f;var d=[[this.a,this.c],[this.b,this.d] ];b.scalex=f.sqrt(k(d[0]));p(d[0]);b.shear=d[0][0]*d[1][0]+d[0][1]*d[1][1];d[1]=[d[1][0]-d[0][0]*b.shear,d[1][1]-d[0][1]*b.shear];b.scaley=f.sqrt(k(d[1]));
p(d[1]);b.shear/=b.scaley;0>this.determinant()&&(b.scalex=-b.scalex);var e=-d[0][1],d=d[1][1];0>d?(b.rotate=a.deg(f.acos(d)),0>e&&(b.rotate=360-b.rotate)):b.rotate=a.deg(f.asin(e));b.isSimple=!+b.shear.toFixed(9)&&(b.scalex.toFixed(9)==b.scaley.toFixed(9)||!b.rotate);b.isSuperSimple=!+b.shear.toFixed(9)&&b.scalex.toFixed(9)==b.scaley.toFixed(9)&&!b.rotate;b.noRotation=!+b.shear.toFixed(9)&&!b.rotate;return b};n.toTransformString=function(a){a=a||this.split();if(+a.shear.toFixed(9))return"m"+[this.get(0),
this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)];a.scalex=+a.scalex.toFixed(4);a.scaley=+a.scaley.toFixed(4);a.rotate=+a.rotate.toFixed(4);return(a.dx||a.dy?"t"+[+a.dx.toFixed(4),+a.dy.toFixed(4)]:"")+(1!=a.scalex||1!=a.scaley?"s"+[a.scalex,a.scaley,0,0]:"")+(a.rotate?"r"+[+a.rotate.toFixed(4),0,0]:"")}})(w.prototype);a.Matrix=w;a.matrix=function(a,d,f,b,k,e){return new w(a,d,f,b,k,e)}});C.plugin(function(a,v,y,M,A){function w(h){return function(d){k.stop();d instanceof A&&1==d.node.childNodes.length&&
("radialGradient"==d.node.firstChild.tagName||"linearGradient"==d.node.firstChild.tagName||"pattern"==d.node.firstChild.tagName)&&(d=d.node.firstChild,b(this).appendChild(d),d=u(d));if(d instanceof v)if("radialGradient"==d.type||"linearGradient"==d.type||"pattern"==d.type){d.node.id||e(d.node,{id:d.id});var f=l(d.node.id)}else f=d.attr(h);else f=a.color(d),f.error?(f=a(b(this).ownerSVGElement).gradient(d))?(f.node.id||e(f.node,{id:f.id}),f=l(f.node.id)):f=d:f=r(f);d={};d[h]=f;e(this.node,d);this.node.style[h]=
x}}function z(a){k.stop();a==+a&&(a+="px");this.node.style.fontSize=a}function d(a){var b=[];a=a.childNodes;for(var e=0,f=a.length;e<f;e++){var l=a[e];3==l.nodeType&&b.push(l.nodeValue);"tspan"==l.tagName&&(1==l.childNodes.length&&3==l.firstChild.nodeType?b.push(l.firstChild.nodeValue):b.push(d(l)))}return b}function f(){k.stop();return this.node.style.fontSize}var n=a._.make,u=a._.wrap,p=a.is,b=a._.getSomeDefs,q=/^url\(#?([^)]+)\)$/,e=a._.$,l=a.url,r=String,s=a._.separator,x="";k.on("snap.util.attr.mask",
function(a){if(a instanceof v||a instanceof A){k.stop();a instanceof A&&1==a.node.childNodes.length&&(a=a.node.firstChild,b(this).appendChild(a),a=u(a));if("mask"==a.type)var d=a;else d=n("mask",b(this)),d.node.appendChild(a.node);!d.node.id&&e(d.node,{id:d.id});e(this.node,{mask:l(d.id)})}});(function(a){k.on("snap.util.attr.clip",a);k.on("snap.util.attr.clip-path",a);k.on("snap.util.attr.clipPath",a)})(function(a){if(a instanceof v||a instanceof A){k.stop();if("clipPath"==a.type)var d=a;else d=
n("clipPath",b(this)),d.node.appendChild(a.node),!d.node.id&&e(d.node,{id:d.id});e(this.node,{"clip-path":l(d.id)})}});k.on("snap.util.attr.fill",w("fill"));k.on("snap.util.attr.stroke",w("stroke"));var G=/^([lr])(?:\(([^)]*)\))?(.*)$/i;k.on("snap.util.grad.parse",function(a){a=r(a);var b=a.match(G);if(!b)return null;a=b[1];var e=b[2],b=b[3],e=e.split(/\s*,\s*/).map(function(a){return+a==a?+a:a});1==e.length&&0==e[0]&&(e=[]);b=b.split("-");b=b.map(function(a){a=a.split(":");var b={color:a[0]};a[1]&&
(b.offset=parseFloat(a[1]));return b});return{type:a,params:e,stops:b}});k.on("snap.util.attr.d",function(b){k.stop();p(b,"array")&&p(b[0],"array")&&(b=a.path.toString.call(b));b=r(b);b.match(/[ruo]/i)&&(b=a.path.toAbsolute(b));e(this.node,{d:b})})(-1);k.on("snap.util.attr.#text",function(a){k.stop();a=r(a);for(a=M.doc.createTextNode(a);this.node.firstChild;)this.node.removeChild(this.node.firstChild);this.node.appendChild(a)})(-1);k.on("snap.util.attr.path",function(a){k.stop();this.attr({d:a})})(-1);
k.on("snap.util.attr.class",function(a){k.stop();this.node.className.baseVal=a})(-1);k.on("snap.util.attr.viewBox",function(a){a=p(a,"object")&&"x"in a?[a.x,a.y,a.width,a.height].join(" "):p(a,"array")?a.join(" "):a;e(this.node,{viewBox:a});k.stop()})(-1);k.on("snap.util.attr.transform",function(a){this.transform(a);k.stop()})(-1);k.on("snap.util.attr.r",function(a){"rect"==this.type&&(k.stop(),e(this.node,{rx:a,ry:a}))})(-1);k.on("snap.util.attr.textpath",function(a){k.stop();if("text"==this.type){var d,
f;if(!a&&this.textPath){for(a=this.textPath;a.node.firstChild;)this.node.appendChild(a.node.firstChild);a.remove();delete this.textPath}else if(p(a,"string")?(d=b(this),a=u(d.parentNode).path(a),d.appendChild(a.node),d=a.id,a.attr({id:d})):(a=u(a),a instanceof v&&(d=a.attr("id"),d||(d=a.id,a.attr({id:d})))),d)if(a=this.textPath,f=this.node,a)a.attr({"xlink:href":"#"+d});else{for(a=e("textPath",{"xlink:href":"#"+d});f.firstChild;)a.appendChild(f.firstChild);f.appendChild(a);this.textPath=u(a)}}})(-1);
k.on("snap.util.attr.text",function(a){if("text"==this.type){for(var b=this.node,d=function(a){var b=e("tspan");if(p(a,"array"))for(var f=0;f<a.length;f++)b.appendChild(d(a[f]));else b.appendChild(M.doc.createTextNode(a));b.normalize&&b.normalize();return b};b.firstChild;)b.removeChild(b.firstChild);for(a=d(a);a.firstChild;)b.appendChild(a.firstChild)}k.stop()})(-1);k.on("snap.util.attr.fontSize",z)(-1);k.on("snap.util.attr.font-size",z)(-1);k.on("snap.util.getattr.transform",function(){k.stop();
return this.transform()})(-1);k.on("snap.util.getattr.textpath",function(){k.stop();return this.textPath})(-1);(function(){function b(d){return function(){k.stop();var b=M.doc.defaultView.getComputedStyle(this.node,null).getPropertyValue("marker-"+d);return"none"==b?b:a(M.doc.getElementById(b.match(q)[1]))}}function d(a){return function(b){k.stop();var d="marker"+a.charAt(0).toUpperCase()+a.substring(1);if(""==b||!b)this.node.style[d]="none";else if("marker"==b.type){var f=b.node.id;f||e(b.node,{id:b.id});
this.node.style[d]=l(f)}}}k.on("snap.util.getattr.marker-end",b("end"))(-1);k.on("snap.util.getattr.markerEnd",b("end"))(-1);k.on("snap.util.getattr.marker-start",b("start"))(-1);k.on("snap.util.getattr.markerStart",b("start"))(-1);k.on("snap.util.getattr.marker-mid",b("mid"))(-1);k.on("snap.util.getattr.markerMid",b("mid"))(-1);k.on("snap.util.attr.marker-end",d("end"))(-1);k.on("snap.util.attr.markerEnd",d("end"))(-1);k.on("snap.util.attr.marker-start",d("start"))(-1);k.on("snap.util.attr.markerStart",
d("start"))(-1);k.on("snap.util.attr.marker-mid",d("mid"))(-1);k.on("snap.util.attr.markerMid",d("mid"))(-1)})();k.on("snap.util.getattr.r",function(){if("rect"==this.type&&e(this.node,"rx")==e(this.node,"ry"))return k.stop(),e(this.node,"rx")})(-1);k.on("snap.util.getattr.text",function(){if("text"==this.type||"tspan"==this.type){k.stop();var a=d(this.node);return 1==a.length?a[0]:a}})(-1);k.on("snap.util.getattr.#text",function(){return this.node.textContent})(-1);k.on("snap.util.getattr.viewBox",
function(){k.stop();var b=e(this.node,"viewBox");if(b)return b=b.split(s),a._.box(+b[0],+b[1],+b[2],+b[3])})(-1);k.on("snap.util.getattr.points",function(){var a=e(this.node,"points");k.stop();if(a)return a.split(s)})(-1);k.on("snap.util.getattr.path",function(){var a=e(this.node,"d");k.stop();return a})(-1);k.on("snap.util.getattr.class",function(){return this.node.className.baseVal})(-1);k.on("snap.util.getattr.fontSize",f)(-1);k.on("snap.util.getattr.font-size",f)(-1)});C.plugin(function(a,v,y,
M,A){function w(a){return a}function z(a){return function(b){return+b.toFixed(3)+a}}var d={"+":function(a,b){return a+b},"-":function(a,b){return a-b},"/":function(a,b){return a/b},"*":function(a,b){return a*b}},f=String,n=/[a-z]+$/i,u=/^\s*([+\-\/*])\s*=\s*([\d.eE+\-]+)\s*([^\d\s]+)?\s*$/;k.on("snap.util.attr",function(a){if(a=f(a).match(u)){var b=k.nt(),b=b.substring(b.lastIndexOf(".")+1),q=this.attr(b),e={};k.stop();var l=a[3]||"",r=q.match(n),s=d[a[1] ];r&&r==l?a=s(parseFloat(q),+a[2]):(q=this.asPX(b),
a=s(this.asPX(b),this.asPX(b,a[2]+l)));isNaN(q)||isNaN(a)||(e[b]=a,this.attr(e))}})(-10);k.on("snap.util.equal",function(a,b){var q=f(this.attr(a)||""),e=f(b).match(u);if(e){k.stop();var l=e[3]||"",r=q.match(n),s=d[e[1] ];if(r&&r==l)return{from:parseFloat(q),to:s(parseFloat(q),+e[2]),f:z(r)};q=this.asPX(a);return{from:q,to:s(q,this.asPX(a,e[2]+l)),f:w}}})(-10)});C.plugin(function(a,v,y,M,A){var w=y.prototype,z=a.is;w.rect=function(a,d,k,p,b,q){var e;null==q&&(q=b);z(a,"object")&&"[object Object]"==
a?e=a:null!=a&&(e={x:a,y:d,width:k,height:p},null!=b&&(e.rx=b,e.ry=q));return this.el("rect",e)};w.circle=function(a,d,k){var p;z(a,"object")&&"[object Object]"==a?p=a:null!=a&&(p={cx:a,cy:d,r:k});return this.el("circle",p)};var d=function(){function a(){this.parentNode.removeChild(this)}return function(d,k){var p=M.doc.createElement("img"),b=M.doc.body;p.style.cssText="position:absolute;left:-9999em;top:-9999em";p.onload=function(){k.call(p);p.onload=p.onerror=null;b.removeChild(p)};p.onerror=a;
b.appendChild(p);p.src=d}}();w.image=function(f,n,k,p,b){var q=this.el("image");if(z(f,"object")&&"src"in f)q.attr(f);else if(null!=f){var e={"xlink:href":f,preserveAspectRatio:"none"};null!=n&&null!=k&&(e.x=n,e.y=k);null!=p&&null!=b?(e.width=p,e.height=b):d(f,function(){a._.$(q.node,{width:this.offsetWidth,height:this.offsetHeight})});a._.$(q.node,e)}return q};w.ellipse=function(a,d,k,p){var b;z(a,"object")&&"[object Object]"==a?b=a:null!=a&&(b={cx:a,cy:d,rx:k,ry:p});return this.el("ellipse",b)};
w.path=function(a){var d;z(a,"object")&&!z(a,"array")?d=a:a&&(d={d:a});return this.el("path",d)};w.group=w.g=function(a){var d=this.el("g");1==arguments.length&&a&&!a.type?d.attr(a):arguments.length&&d.add(Array.prototype.slice.call(arguments,0));return d};w.svg=function(a,d,k,p,b,q,e,l){var r={};z(a,"object")&&null==d?r=a:(null!=a&&(r.x=a),null!=d&&(r.y=d),null!=k&&(r.width=k),null!=p&&(r.height=p),null!=b&&null!=q&&null!=e&&null!=l&&(r.viewBox=[b,q,e,l]));return this.el("svg",r)};w.mask=function(a){var d=
this.el("mask");1==arguments.length&&a&&!a.type?d.attr(a):arguments.length&&d.add(Array.prototype.slice.call(arguments,0));return d};w.ptrn=function(a,d,k,p,b,q,e,l){if(z(a,"object"))var r=a;else arguments.length?(r={},null!=a&&(r.x=a),null!=d&&(r.y=d),null!=k&&(r.width=k),null!=p&&(r.height=p),null!=b&&null!=q&&null!=e&&null!=l&&(r.viewBox=[b,q,e,l])):r={patternUnits:"userSpaceOnUse"};return this.el("pattern",r)};w.use=function(a){return null!=a?(make("use",this.node),a instanceof v&&(a.attr("id")||
a.attr({id:ID()}),a=a.attr("id")),this.el("use",{"xlink:href":a})):v.prototype.use.call(this)};w.text=function(a,d,k){var p={};z(a,"object")?p=a:null!=a&&(p={x:a,y:d,text:k||""});return this.el("text",p)};w.line=function(a,d,k,p){var b={};z(a,"object")?b=a:null!=a&&(b={x1:a,x2:k,y1:d,y2:p});return this.el("line",b)};w.polyline=function(a){1<arguments.length&&(a=Array.prototype.slice.call(arguments,0));var d={};z(a,"object")&&!z(a,"array")?d=a:null!=a&&(d={points:a});return this.el("polyline",d)};
w.polygon=function(a){1<arguments.length&&(a=Array.prototype.slice.call(arguments,0));var d={};z(a,"object")&&!z(a,"array")?d=a:null!=a&&(d={points:a});return this.el("polygon",d)};(function(){function d(){return this.selectAll("stop")}function n(b,d){var f=e("stop"),k={offset:+d+"%"};b=a.color(b);k["stop-color"]=b.hex;1>b.opacity&&(k["stop-opacity"]=b.opacity);e(f,k);this.node.appendChild(f);return this}function u(){if("linearGradient"==this.type){var b=e(this.node,"x1")||0,d=e(this.node,"x2")||
1,f=e(this.node,"y1")||0,k=e(this.node,"y2")||0;return a._.box(b,f,math.abs(d-b),math.abs(k-f))}b=this.node.r||0;return a._.box((this.node.cx||0.5)-b,(this.node.cy||0.5)-b,2*b,2*b)}function p(a,d){function f(a,b){for(var d=(b-u)/(a-w),e=w;e<a;e++)h[e].offset=+(+u+d*(e-w)).toFixed(2);w=a;u=b}var n=k("snap.util.grad.parse",null,d).firstDefined(),p;if(!n)return null;n.params.unshift(a);p="l"==n.type.toLowerCase()?b.apply(0,n.params):q.apply(0,n.params);n.type!=n.type.toLowerCase()&&e(p.node,{gradientUnits:"userSpaceOnUse"});
var h=n.stops,n=h.length,u=0,w=0;n--;for(var v=0;v<n;v++)"offset"in h[v]&&f(v,h[v].offset);h[n].offset=h[n].offset||100;f(n,h[n].offset);for(v=0;v<=n;v++){var y=h[v];p.addStop(y.color,y.offset)}return p}function b(b,k,p,q,w){b=a._.make("linearGradient",b);b.stops=d;b.addStop=n;b.getBBox=u;null!=k&&e(b.node,{x1:k,y1:p,x2:q,y2:w});return b}function q(b,k,p,q,w,h){b=a._.make("radialGradient",b);b.stops=d;b.addStop=n;b.getBBox=u;null!=k&&e(b.node,{cx:k,cy:p,r:q});null!=w&&null!=h&&e(b.node,{fx:w,fy:h});
return b}var e=a._.$;w.gradient=function(a){return p(this.defs,a)};w.gradientLinear=function(a,d,e,f){return b(this.defs,a,d,e,f)};w.gradientRadial=function(a,b,d,e,f){return q(this.defs,a,b,d,e,f)};w.toString=function(){var b=this.node.ownerDocument,d=b.createDocumentFragment(),b=b.createElement("div"),e=this.node.cloneNode(!0);d.appendChild(b);b.appendChild(e);a._.$(e,{xmlns:"http://www.w3.org/2000/svg"});b=b.innerHTML;d.removeChild(d.firstChild);return b};w.clear=function(){for(var a=this.node.firstChild,
b;a;)b=a.nextSibling,"defs"!=a.tagName?a.parentNode.removeChild(a):w.clear.call({node:a}),a=b}})()});C.plugin(function(a,k,y,M){function A(a){var b=A.ps=A.ps||{};b[a]?b[a].sleep=100:b[a]={sleep:100};setTimeout(function(){for(var d in b)b[L](d)&&d!=a&&(b[d].sleep--,!b[d].sleep&&delete b[d])});return b[a]}function w(a,b,d,e){null==a&&(a=b=d=e=0);null==b&&(b=a.y,d=a.width,e=a.height,a=a.x);return{x:a,y:b,width:d,w:d,height:e,h:e,x2:a+d,y2:b+e,cx:a+d/2,cy:b+e/2,r1:F.min(d,e)/2,r2:F.max(d,e)/2,r0:F.sqrt(d*
d+e*e)/2,path:s(a,b,d,e),vb:[a,b,d,e].join(" ")}}function z(){return this.join(",").replace(N,"$1")}function d(a){a=C(a);a.toString=z;return a}function f(a,b,d,h,f,k,l,n,p){if(null==p)return e(a,b,d,h,f,k,l,n);if(0>p||e(a,b,d,h,f,k,l,n)<p)p=void 0;else{var q=0.5,O=1-q,s;for(s=e(a,b,d,h,f,k,l,n,O);0.01<Z(s-p);)q/=2,O+=(s<p?1:-1)*q,s=e(a,b,d,h,f,k,l,n,O);p=O}return u(a,b,d,h,f,k,l,n,p)}function n(b,d){function e(a){return+(+a).toFixed(3)}return a._.cacher(function(a,h,l){a instanceof k&&(a=a.attr("d"));
a=I(a);for(var n,p,D,q,O="",s={},c=0,t=0,r=a.length;t<r;t++){D=a[t];if("M"==D[0])n=+D[1],p=+D[2];else{q=f(n,p,D[1],D[2],D[3],D[4],D[5],D[6]);if(c+q>h){if(d&&!s.start){n=f(n,p,D[1],D[2],D[3],D[4],D[5],D[6],h-c);O+=["C"+e(n.start.x),e(n.start.y),e(n.m.x),e(n.m.y),e(n.x),e(n.y)];if(l)return O;s.start=O;O=["M"+e(n.x),e(n.y)+"C"+e(n.n.x),e(n.n.y),e(n.end.x),e(n.end.y),e(D[5]),e(D[6])].join();c+=q;n=+D[5];p=+D[6];continue}if(!b&&!d)return n=f(n,p,D[1],D[2],D[3],D[4],D[5],D[6],h-c)}c+=q;n=+D[5];p=+D[6]}O+=
D.shift()+D}s.end=O;return n=b?c:d?s:u(n,p,D[0],D[1],D[2],D[3],D[4],D[5],1)},null,a._.clone)}function u(a,b,d,e,h,f,k,l,n){var p=1-n,q=ma(p,3),s=ma(p,2),c=n*n,t=c*n,r=q*a+3*s*n*d+3*p*n*n*h+t*k,q=q*b+3*s*n*e+3*p*n*n*f+t*l,s=a+2*n*(d-a)+c*(h-2*d+a),t=b+2*n*(e-b)+c*(f-2*e+b),x=d+2*n*(h-d)+c*(k-2*h+d),c=e+2*n*(f-e)+c*(l-2*f+e);a=p*a+n*d;b=p*b+n*e;h=p*h+n*k;f=p*f+n*l;l=90-180*F.atan2(s-x,t-c)/S;return{x:r,y:q,m:{x:s,y:t},n:{x:x,y:c},start:{x:a,y:b},end:{x:h,y:f},alpha:l}}function p(b,d,e,h,f,n,k,l){a.is(b,
"array")||(b=[b,d,e,h,f,n,k,l]);b=U.apply(null,b);return w(b.min.x,b.min.y,b.max.x-b.min.x,b.max.y-b.min.y)}function b(a,b,d){return b>=a.x&&b<=a.x+a.width&&d>=a.y&&d<=a.y+a.height}function q(a,d){a=w(a);d=w(d);return b(d,a.x,a.y)||b(d,a.x2,a.y)||b(d,a.x,a.y2)||b(d,a.x2,a.y2)||b(a,d.x,d.y)||b(a,d.x2,d.y)||b(a,d.x,d.y2)||b(a,d.x2,d.y2)||(a.x<d.x2&&a.x>d.x||d.x<a.x2&&d.x>a.x)&&(a.y<d.y2&&a.y>d.y||d.y<a.y2&&d.y>a.y)}function e(a,b,d,e,h,f,n,k,l){null==l&&(l=1);l=(1<l?1:0>l?0:l)/2;for(var p=[-0.1252,
0.1252,-0.3678,0.3678,-0.5873,0.5873,-0.7699,0.7699,-0.9041,0.9041,-0.9816,0.9816],q=[0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],s=0,c=0;12>c;c++)var t=l*p[c]+l,r=t*(t*(-3*a+9*d-9*h+3*n)+6*a-12*d+6*h)-3*a+3*d,t=t*(t*(-3*b+9*e-9*f+3*k)+6*b-12*e+6*f)-3*b+3*e,s=s+q[c]*F.sqrt(r*r+t*t);return l*s}function l(a,b,d){a=I(a);b=I(b);for(var h,f,l,n,k,s,r,O,x,c,t=d?0:[],w=0,v=a.length;w<v;w++)if(x=a[w],"M"==x[0])h=k=x[1],f=s=x[2];else{"C"==x[0]?(x=[h,f].concat(x.slice(1)),
h=x[6],f=x[7]):(x=[h,f,h,f,k,s,k,s],h=k,f=s);for(var G=0,y=b.length;G<y;G++)if(c=b[G],"M"==c[0])l=r=c[1],n=O=c[2];else{"C"==c[0]?(c=[l,n].concat(c.slice(1)),l=c[6],n=c[7]):(c=[l,n,l,n,r,O,r,O],l=r,n=O);var z;var K=x,B=c;z=d;var H=p(K),J=p(B);if(q(H,J)){for(var H=e.apply(0,K),J=e.apply(0,B),H=~~(H/8),J=~~(J/8),U=[],A=[],F={},M=z?0:[],P=0;P<H+1;P++){var C=u.apply(0,K.concat(P/H));U.push({x:C.x,y:C.y,t:P/H})}for(P=0;P<J+1;P++)C=u.apply(0,B.concat(P/J)),A.push({x:C.x,y:C.y,t:P/J});for(P=0;P<H;P++)for(K=
0;K<J;K++){var Q=U[P],L=U[P+1],B=A[K],C=A[K+1],N=0.001>Z(L.x-Q.x)?"y":"x",S=0.001>Z(C.x-B.x)?"y":"x",R;R=Q.x;var Y=Q.y,V=L.x,ea=L.y,fa=B.x,ga=B.y,ha=C.x,ia=C.y;if(W(R,V)<X(fa,ha)||X(R,V)>W(fa,ha)||W(Y,ea)<X(ga,ia)||X(Y,ea)>W(ga,ia))R=void 0;else{var $=(R*ea-Y*V)*(fa-ha)-(R-V)*(fa*ia-ga*ha),aa=(R*ea-Y*V)*(ga-ia)-(Y-ea)*(fa*ia-ga*ha),ja=(R-V)*(ga-ia)-(Y-ea)*(fa-ha);if(ja){var $=$/ja,aa=aa/ja,ja=+$.toFixed(2),ba=+aa.toFixed(2);R=ja<+X(R,V).toFixed(2)||ja>+W(R,V).toFixed(2)||ja<+X(fa,ha).toFixed(2)||
ja>+W(fa,ha).toFixed(2)||ba<+X(Y,ea).toFixed(2)||ba>+W(Y,ea).toFixed(2)||ba<+X(ga,ia).toFixed(2)||ba>+W(ga,ia).toFixed(2)?void 0:{x:$,y:aa}}else R=void 0}R&&F[R.x.toFixed(4)]!=R.y.toFixed(4)&&(F[R.x.toFixed(4)]=R.y.toFixed(4),Q=Q.t+Z((R[N]-Q[N])/(L[N]-Q[N]))*(L.t-Q.t),B=B.t+Z((R[S]-B[S])/(C[S]-B[S]))*(C.t-B.t),0<=Q&&1>=Q&&0<=B&&1>=B&&(z?M++:M.push({x:R.x,y:R.y,t1:Q,t2:B})))}z=M}else z=z?0:[];if(d)t+=z;else{H=0;for(J=z.length;H<J;H++)z[H].segment1=w,z[H].segment2=G,z[H].bez1=x,z[H].bez2=c;t=t.concat(z)}}}return t}
function r(a){var b=A(a);if(b.bbox)return C(b.bbox);if(!a)return w();a=I(a);for(var d=0,e=0,h=[],f=[],l,n=0,k=a.length;n<k;n++)l=a[n],"M"==l[0]?(d=l[1],e=l[2],h.push(d),f.push(e)):(d=U(d,e,l[1],l[2],l[3],l[4],l[5],l[6]),h=h.concat(d.min.x,d.max.x),f=f.concat(d.min.y,d.max.y),d=l[5],e=l[6]);a=X.apply(0,h);l=X.apply(0,f);h=W.apply(0,h);f=W.apply(0,f);f=w(a,l,h-a,f-l);b.bbox=C(f);return f}function s(a,b,d,e,h){if(h)return[["M",+a+ +h,b],["l",d-2*h,0],["a",h,h,0,0,1,h,h],["l",0,e-2*h],["a",h,h,0,0,1,
-h,h],["l",2*h-d,0],["a",h,h,0,0,1,-h,-h],["l",0,2*h-e],["a",h,h,0,0,1,h,-h],["z"] ];a=[["M",a,b],["l",d,0],["l",0,e],["l",-d,0],["z"] ];a.toString=z;return a}function x(a,b,d,e,h){null==h&&null==e&&(e=d);a=+a;b=+b;d=+d;e=+e;if(null!=h){var f=Math.PI/180,l=a+d*Math.cos(-e*f);a+=d*Math.cos(-h*f);var n=b+d*Math.sin(-e*f);b+=d*Math.sin(-h*f);d=[["M",l,n],["A",d,d,0,+(180<h-e),0,a,b] ]}else d=[["M",a,b],["m",0,-e],["a",d,e,0,1,1,0,2*e],["a",d,e,0,1,1,0,-2*e],["z"] ];d.toString=z;return d}function G(b){var e=
A(b);if(e.abs)return d(e.abs);Q(b,"array")&&Q(b&&b[0],"array")||(b=a.parsePathString(b));if(!b||!b.length)return[["M",0,0] ];var h=[],f=0,l=0,n=0,k=0,p=0;"M"==b[0][0]&&(f=+b[0][1],l=+b[0][2],n=f,k=l,p++,h[0]=["M",f,l]);for(var q=3==b.length&&"M"==b[0][0]&&"R"==b[1][0].toUpperCase()&&"Z"==b[2][0].toUpperCase(),s,r,w=p,c=b.length;w<c;w++){h.push(s=[]);r=b[w];p=r[0];if(p!=p.toUpperCase())switch(s[0]=p.toUpperCase(),s[0]){case "A":s[1]=r[1];s[2]=r[2];s[3]=r[3];s[4]=r[4];s[5]=r[5];s[6]=+r[6]+f;s[7]=+r[7]+
l;break;case "V":s[1]=+r[1]+l;break;case "H":s[1]=+r[1]+f;break;case "R":for(var t=[f,l].concat(r.slice(1)),u=2,v=t.length;u<v;u++)t[u]=+t[u]+f,t[++u]=+t[u]+l;h.pop();h=h.concat(P(t,q));break;case "O":h.pop();t=x(f,l,r[1],r[2]);t.push(t[0]);h=h.concat(t);break;case "U":h.pop();h=h.concat(x(f,l,r[1],r[2],r[3]));s=["U"].concat(h[h.length-1].slice(-2));break;case "M":n=+r[1]+f,k=+r[2]+l;default:for(u=1,v=r.length;u<v;u++)s[u]=+r[u]+(u%2?f:l)}else if("R"==p)t=[f,l].concat(r.slice(1)),h.pop(),h=h.concat(P(t,
q)),s=["R"].concat(r.slice(-2));else if("O"==p)h.pop(),t=x(f,l,r[1],r[2]),t.push(t[0]),h=h.concat(t);else if("U"==p)h.pop(),h=h.concat(x(f,l,r[1],r[2],r[3])),s=["U"].concat(h[h.length-1].slice(-2));else for(t=0,u=r.length;t<u;t++)s[t]=r[t];p=p.toUpperCase();if("O"!=p)switch(s[0]){case "Z":f=+n;l=+k;break;case "H":f=s[1];break;case "V":l=s[1];break;case "M":n=s[s.length-2],k=s[s.length-1];default:f=s[s.length-2],l=s[s.length-1]}}h.toString=z;e.abs=d(h);return h}function h(a,b,d,e){return[a,b,d,e,d,
e]}function J(a,b,d,e,h,f){var l=1/3,n=2/3;return[l*a+n*d,l*b+n*e,l*h+n*d,l*f+n*e,h,f]}function K(b,d,e,h,f,l,n,k,p,s){var r=120*S/180,q=S/180*(+f||0),c=[],t,x=a._.cacher(function(a,b,c){var d=a*F.cos(c)-b*F.sin(c);a=a*F.sin(c)+b*F.cos(c);return{x:d,y:a}});if(s)v=s[0],t=s[1],l=s[2],u=s[3];else{t=x(b,d,-q);b=t.x;d=t.y;t=x(k,p,-q);k=t.x;p=t.y;F.cos(S/180*f);F.sin(S/180*f);t=(b-k)/2;v=(d-p)/2;u=t*t/(e*e)+v*v/(h*h);1<u&&(u=F.sqrt(u),e*=u,h*=u);var u=e*e,w=h*h,u=(l==n?-1:1)*F.sqrt(Z((u*w-u*v*v-w*t*t)/
(u*v*v+w*t*t)));l=u*e*v/h+(b+k)/2;var u=u*-h*t/e+(d+p)/2,v=F.asin(((d-u)/h).toFixed(9));t=F.asin(((p-u)/h).toFixed(9));v=b<l?S-v:v;t=k<l?S-t:t;0>v&&(v=2*S+v);0>t&&(t=2*S+t);n&&v>t&&(v-=2*S);!n&&t>v&&(t-=2*S)}if(Z(t-v)>r){var c=t,w=k,G=p;t=v+r*(n&&t>v?1:-1);k=l+e*F.cos(t);p=u+h*F.sin(t);c=K(k,p,e,h,f,0,n,w,G,[t,c,l,u])}l=t-v;f=F.cos(v);r=F.sin(v);n=F.cos(t);t=F.sin(t);l=F.tan(l/4);e=4/3*e*l;l*=4/3*h;h=[b,d];b=[b+e*r,d-l*f];d=[k+e*t,p-l*n];k=[k,p];b[0]=2*h[0]-b[0];b[1]=2*h[1]-b[1];if(s)return[b,d,k].concat(c);
c=[b,d,k].concat(c).join().split(",");s=[];k=0;for(p=c.length;k<p;k++)s[k]=k%2?x(c[k-1],c[k],q).y:x(c[k],c[k+1],q).x;return s}function U(a,b,d,e,h,f,l,k){for(var n=[],p=[[],[] ],s,r,c,t,q=0;2>q;++q)0==q?(r=6*a-12*d+6*h,s=-3*a+9*d-9*h+3*l,c=3*d-3*a):(r=6*b-12*e+6*f,s=-3*b+9*e-9*f+3*k,c=3*e-3*b),1E-12>Z(s)?1E-12>Z(r)||(s=-c/r,0<s&&1>s&&n.push(s)):(t=r*r-4*c*s,c=F.sqrt(t),0>t||(t=(-r+c)/(2*s),0<t&&1>t&&n.push(t),s=(-r-c)/(2*s),0<s&&1>s&&n.push(s)));for(r=q=n.length;q--;)s=n[q],c=1-s,p[0][q]=c*c*c*a+3*
c*c*s*d+3*c*s*s*h+s*s*s*l,p[1][q]=c*c*c*b+3*c*c*s*e+3*c*s*s*f+s*s*s*k;p[0][r]=a;p[1][r]=b;p[0][r+1]=l;p[1][r+1]=k;p[0].length=p[1].length=r+2;return{min:{x:X.apply(0,p[0]),y:X.apply(0,p[1])},max:{x:W.apply(0,p[0]),y:W.apply(0,p[1])}}}function I(a,b){var e=!b&&A(a);if(!b&&e.curve)return d(e.curve);var f=G(a),l=b&&G(b),n={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},k={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},p=function(a,b,c){if(!a)return["C",b.x,b.y,b.x,b.y,b.x,b.y];a[0]in{T:1,Q:1}||(b.qx=b.qy=null);
switch(a[0]){case "M":b.X=a[1];b.Y=a[2];break;case "A":a=["C"].concat(K.apply(0,[b.x,b.y].concat(a.slice(1))));break;case "S":"C"==c||"S"==c?(c=2*b.x-b.bx,b=2*b.y-b.by):(c=b.x,b=b.y);a=["C",c,b].concat(a.slice(1));break;case "T":"Q"==c||"T"==c?(b.qx=2*b.x-b.qx,b.qy=2*b.y-b.qy):(b.qx=b.x,b.qy=b.y);a=["C"].concat(J(b.x,b.y,b.qx,b.qy,a[1],a[2]));break;case "Q":b.qx=a[1];b.qy=a[2];a=["C"].concat(J(b.x,b.y,a[1],a[2],a[3],a[4]));break;case "L":a=["C"].concat(h(b.x,b.y,a[1],a[2]));break;case "H":a=["C"].concat(h(b.x,
b.y,a[1],b.y));break;case "V":a=["C"].concat(h(b.x,b.y,b.x,a[1]));break;case "Z":a=["C"].concat(h(b.x,b.y,b.X,b.Y))}return a},s=function(a,b){if(7<a[b].length){a[b].shift();for(var c=a[b];c.length;)q[b]="A",l&&(u[b]="A"),a.splice(b++,0,["C"].concat(c.splice(0,6)));a.splice(b,1);v=W(f.length,l&&l.length||0)}},r=function(a,b,c,d,e){a&&b&&"M"==a[e][0]&&"M"!=b[e][0]&&(b.splice(e,0,["M",d.x,d.y]),c.bx=0,c.by=0,c.x=a[e][1],c.y=a[e][2],v=W(f.length,l&&l.length||0))},q=[],u=[],c="",t="",x=0,v=W(f.length,
l&&l.length||0);for(;x<v;x++){f[x]&&(c=f[x][0]);"C"!=c&&(q[x]=c,x&&(t=q[x-1]));f[x]=p(f[x],n,t);"A"!=q[x]&&"C"==c&&(q[x]="C");s(f,x);l&&(l[x]&&(c=l[x][0]),"C"!=c&&(u[x]=c,x&&(t=u[x-1])),l[x]=p(l[x],k,t),"A"!=u[x]&&"C"==c&&(u[x]="C"),s(l,x));r(f,l,n,k,x);r(l,f,k,n,x);var w=f[x],z=l&&l[x],y=w.length,U=l&&z.length;n.x=w[y-2];n.y=w[y-1];n.bx=$(w[y-4])||n.x;n.by=$(w[y-3])||n.y;k.bx=l&&($(z[U-4])||k.x);k.by=l&&($(z[U-3])||k.y);k.x=l&&z[U-2];k.y=l&&z[U-1]}l||(e.curve=d(f));return l?[f,l]:f}function P(a,
b){for(var d=[],e=0,h=a.length;h-2*!b>e;e+=2){var f=[{x:+a[e-2],y:+a[e-1]},{x:+a[e],y:+a[e+1]},{x:+a[e+2],y:+a[e+3]},{x:+a[e+4],y:+a[e+5]}];b?e?h-4==e?f[3]={x:+a[0],y:+a[1]}:h-2==e&&(f[2]={x:+a[0],y:+a[1]},f[3]={x:+a[2],y:+a[3]}):f[0]={x:+a[h-2],y:+a[h-1]}:h-4==e?f[3]=f[2]:e||(f[0]={x:+a[e],y:+a[e+1]});d.push(["C",(-f[0].x+6*f[1].x+f[2].x)/6,(-f[0].y+6*f[1].y+f[2].y)/6,(f[1].x+6*f[2].x-f[3].x)/6,(f[1].y+6*f[2].y-f[3].y)/6,f[2].x,f[2].y])}return d}y=k.prototype;var Q=a.is,C=a._.clone,L="hasOwnProperty",
N=/,?([a-z]),?/gi,$=parseFloat,F=Math,S=F.PI,X=F.min,W=F.max,ma=F.pow,Z=F.abs;M=n(1);var na=n(),ba=n(0,1),V=a._unit2px;a.path=A;a.path.getTotalLength=M;a.path.getPointAtLength=na;a.path.getSubpath=function(a,b,d){if(1E-6>this.getTotalLength(a)-d)return ba(a,b).end;a=ba(a,d,1);return b?ba(a,b).end:a};y.getTotalLength=function(){if(this.node.getTotalLength)return this.node.getTotalLength()};y.getPointAtLength=function(a){return na(this.attr("d"),a)};y.getSubpath=function(b,d){return a.path.getSubpath(this.attr("d"),
b,d)};a._.box=w;a.path.findDotsAtSegment=u;a.path.bezierBBox=p;a.path.isPointInsideBBox=b;a.path.isBBoxIntersect=q;a.path.intersection=function(a,b){return l(a,b)};a.path.intersectionNumber=function(a,b){return l(a,b,1)};a.path.isPointInside=function(a,d,e){var h=r(a);return b(h,d,e)&&1==l(a,[["M",d,e],["H",h.x2+10] ],1)%2};a.path.getBBox=r;a.path.get={path:function(a){return a.attr("path")},circle:function(a){a=V(a);return x(a.cx,a.cy,a.r)},ellipse:function(a){a=V(a);return x(a.cx||0,a.cy||0,a.rx,
a.ry)},rect:function(a){a=V(a);return s(a.x||0,a.y||0,a.width,a.height,a.rx,a.ry)},image:function(a){a=V(a);return s(a.x||0,a.y||0,a.width,a.height)},line:function(a){return"M"+[a.attr("x1")||0,a.attr("y1")||0,a.attr("x2"),a.attr("y2")]},polyline:function(a){return"M"+a.attr("points")},polygon:function(a){return"M"+a.attr("points")+"z"},deflt:function(a){a=a.node.getBBox();return s(a.x,a.y,a.width,a.height)}};a.path.toRelative=function(b){var e=A(b),h=String.prototype.toLowerCase;if(e.rel)return d(e.rel);
a.is(b,"array")&&a.is(b&&b[0],"array")||(b=a.parsePathString(b));var f=[],l=0,n=0,k=0,p=0,s=0;"M"==b[0][0]&&(l=b[0][1],n=b[0][2],k=l,p=n,s++,f.push(["M",l,n]));for(var r=b.length;s<r;s++){var q=f[s]=[],x=b[s];if(x[0]!=h.call(x[0]))switch(q[0]=h.call(x[0]),q[0]){case "a":q[1]=x[1];q[2]=x[2];q[3]=x[3];q[4]=x[4];q[5]=x[5];q[6]=+(x[6]-l).toFixed(3);q[7]=+(x[7]-n).toFixed(3);break;case "v":q[1]=+(x[1]-n).toFixed(3);break;case "m":k=x[1],p=x[2];default:for(var c=1,t=x.length;c<t;c++)q[c]=+(x[c]-(c%2?l:
n)).toFixed(3)}else for(f[s]=[],"m"==x[0]&&(k=x[1]+l,p=x[2]+n),q=0,c=x.length;q<c;q++)f[s][q]=x[q];x=f[s].length;switch(f[s][0]){case "z":l=k;n=p;break;case "h":l+=+f[s][x-1];break;case "v":n+=+f[s][x-1];break;default:l+=+f[s][x-2],n+=+f[s][x-1]}}f.toString=z;e.rel=d(f);return f};a.path.toAbsolute=G;a.path.toCubic=I;a.path.map=function(a,b){if(!b)return a;var d,e,h,f,l,n,k;a=I(a);h=0;for(l=a.length;h<l;h++)for(k=a[h],f=1,n=k.length;f<n;f+=2)d=b.x(k[f],k[f+1]),e=b.y(k[f],k[f+1]),k[f]=d,k[f+1]=e;return a};
a.path.toString=z;a.path.clone=d});C.plugin(function(a,v,y,C){var A=Math.max,w=Math.min,z=function(a){this.items=[];this.bindings={};this.length=0;this.type="set";if(a)for(var f=0,n=a.length;f<n;f++)a[f]&&(this[this.items.length]=this.items[this.items.length]=a[f],this.length++)};v=z.prototype;v.push=function(){for(var a,f,n=0,k=arguments.length;n<k;n++)if(a=arguments[n])f=this.items.length,this[f]=this.items[f]=a,this.length++;return this};v.pop=function(){this.length&&delete this[this.length--];
return this.items.pop()};v.forEach=function(a,f){for(var n=0,k=this.items.length;n<k&&!1!==a.call(f,this.items[n],n);n++);return this};v.animate=function(d,f,n,u){"function"!=typeof n||n.length||(u=n,n=L.linear);d instanceof a._.Animation&&(u=d.callback,n=d.easing,f=n.dur,d=d.attr);var p=arguments;if(a.is(d,"array")&&a.is(p[p.length-1],"array"))var b=!0;var q,e=function(){q?this.b=q:q=this.b},l=0,r=u&&function(){l++==this.length&&u.call(this)};return this.forEach(function(a,l){k.once("snap.animcreated."+
a.id,e);b?p[l]&&a.animate.apply(a,p[l]):a.animate(d,f,n,r)})};v.remove=function(){for(;this.length;)this.pop().remove();return this};v.bind=function(a,f,k){var u={};if("function"==typeof f)this.bindings[a]=f;else{var p=k||a;this.bindings[a]=function(a){u[p]=a;f.attr(u)}}return this};v.attr=function(a){var f={},k;for(k in a)if(this.bindings[k])this.bindings[k](a[k]);else f[k]=a[k];a=0;for(k=this.items.length;a<k;a++)this.items[a].attr(f);return this};v.clear=function(){for(;this.length;)this.pop()};
v.splice=function(a,f,k){a=0>a?A(this.length+a,0):a;f=A(0,w(this.length-a,f));var u=[],p=[],b=[],q;for(q=2;q<arguments.length;q++)b.push(arguments[q]);for(q=0;q<f;q++)p.push(this[a+q]);for(;q<this.length-a;q++)u.push(this[a+q]);var e=b.length;for(q=0;q<e+u.length;q++)this.items[a+q]=this[a+q]=q<e?b[q]:u[q-e];for(q=this.items.length=this.length-=f-e;this[q];)delete this[q++];return new z(p)};v.exclude=function(a){for(var f=0,k=this.length;f<k;f++)if(this[f]==a)return this.splice(f,1),!0;return!1};
v.insertAfter=function(a){for(var f=this.items.length;f--;)this.items[f].insertAfter(a);return this};v.getBBox=function(){for(var a=[],f=[],k=[],u=[],p=this.items.length;p--;)if(!this.items[p].removed){var b=this.items[p].getBBox();a.push(b.x);f.push(b.y);k.push(b.x+b.width);u.push(b.y+b.height)}a=w.apply(0,a);f=w.apply(0,f);k=A.apply(0,k);u=A.apply(0,u);return{x:a,y:f,x2:k,y2:u,width:k-a,height:u-f,cx:a+(k-a)/2,cy:f+(u-f)/2}};v.clone=function(a){a=new z;for(var f=0,k=this.items.length;f<k;f++)a.push(this.items[f].clone());
return a};v.toString=function(){return"Snap\u2018s set"};v.type="set";a.set=function(){var a=new z;arguments.length&&a.push.apply(a,Array.prototype.slice.call(arguments,0));return a}});C.plugin(function(a,v,y,C){function A(a){var b=a[0];switch(b.toLowerCase()){case "t":return[b,0,0];case "m":return[b,1,0,0,1,0,0];case "r":return 4==a.length?[b,0,a[2],a[3] ]:[b,0];case "s":return 5==a.length?[b,1,1,a[3],a[4] ]:3==a.length?[b,1,1]:[b,1]}}function w(b,d,f){d=q(d).replace(/\.{3}|\u2026/g,b);b=a.parseTransformString(b)||
[];d=a.parseTransformString(d)||[];for(var k=Math.max(b.length,d.length),p=[],v=[],h=0,w,z,y,I;h<k;h++){y=b[h]||A(d[h]);I=d[h]||A(y);if(y[0]!=I[0]||"r"==y[0].toLowerCase()&&(y[2]!=I[2]||y[3]!=I[3])||"s"==y[0].toLowerCase()&&(y[3]!=I[3]||y[4]!=I[4])){b=a._.transform2matrix(b,f());d=a._.transform2matrix(d,f());p=[["m",b.a,b.b,b.c,b.d,b.e,b.f] ];v=[["m",d.a,d.b,d.c,d.d,d.e,d.f] ];break}p[h]=[];v[h]=[];w=0;for(z=Math.max(y.length,I.length);w<z;w++)w in y&&(p[h][w]=y[w]),w in I&&(v[h][w]=I[w])}return{from:u(p),
to:u(v),f:n(p)}}function z(a){return a}function d(a){return function(b){return+b.toFixed(3)+a}}function f(b){return a.rgb(b[0],b[1],b[2])}function n(a){var b=0,d,f,k,n,h,p,q=[];d=0;for(f=a.length;d<f;d++){h="[";p=['"'+a[d][0]+'"'];k=1;for(n=a[d].length;k<n;k++)p[k]="val["+b++ +"]";h+=p+"]";q[d]=h}return Function("val","return Snap.path.toString.call(["+q+"])")}function u(a){for(var b=[],d=0,f=a.length;d<f;d++)for(var k=1,n=a[d].length;k<n;k++)b.push(a[d][k]);return b}var p={},b=/[a-z]+$/i,q=String;
p.stroke=p.fill="colour";v.prototype.equal=function(a,b){return k("snap.util.equal",this,a,b).firstDefined()};k.on("snap.util.equal",function(e,k){var r,s;r=q(this.attr(e)||"");var x=this;if(r==+r&&k==+k)return{from:+r,to:+k,f:z};if("colour"==p[e])return r=a.color(r),s=a.color(k),{from:[r.r,r.g,r.b,r.opacity],to:[s.r,s.g,s.b,s.opacity],f:f};if("transform"==e||"gradientTransform"==e||"patternTransform"==e)return k instanceof a.Matrix&&(k=k.toTransformString()),a._.rgTransform.test(k)||(k=a._.svgTransform2string(k)),
w(r,k,function(){return x.getBBox(1)});if("d"==e||"path"==e)return r=a.path.toCubic(r,k),{from:u(r[0]),to:u(r[1]),f:n(r[0])};if("points"==e)return r=q(r).split(a._.separator),s=q(k).split(a._.separator),{from:r,to:s,f:function(a){return a}};aUnit=r.match(b);s=q(k).match(b);return aUnit&&aUnit==s?{from:parseFloat(r),to:parseFloat(k),f:d(aUnit)}:{from:this.asPX(e),to:this.asPX(e,k),f:z}})});C.plugin(function(a,v,y,C){var A=v.prototype,w="createTouch"in C.doc;v="click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel".split(" ");
var z={mousedown:"touchstart",mousemove:"touchmove",mouseup:"touchend"},d=function(a,b){var d="y"==a?"scrollTop":"scrollLeft",e=b&&b.node?b.node.ownerDocument:C.doc;return e[d in e.documentElement?"documentElement":"body"][d]},f=function(){this.returnValue=!1},n=function(){return this.originalEvent.preventDefault()},u=function(){this.cancelBubble=!0},p=function(){return this.originalEvent.stopPropagation()},b=function(){if(C.doc.addEventListener)return function(a,b,e,f){var k=w&&z[b]?z[b]:b,l=function(k){var l=
d("y",f),q=d("x",f);if(w&&z.hasOwnProperty(b))for(var r=0,u=k.targetTouches&&k.targetTouches.length;r<u;r++)if(k.targetTouches[r].target==a||a.contains(k.targetTouches[r].target)){u=k;k=k.targetTouches[r];k.originalEvent=u;k.preventDefault=n;k.stopPropagation=p;break}return e.call(f,k,k.clientX+q,k.clientY+l)};b!==k&&a.addEventListener(b,l,!1);a.addEventListener(k,l,!1);return function(){b!==k&&a.removeEventListener(b,l,!1);a.removeEventListener(k,l,!1);return!0}};if(C.doc.attachEvent)return function(a,
b,e,h){var k=function(a){a=a||h.node.ownerDocument.window.event;var b=d("y",h),k=d("x",h),k=a.clientX+k,b=a.clientY+b;a.preventDefault=a.preventDefault||f;a.stopPropagation=a.stopPropagation||u;return e.call(h,a,k,b)};a.attachEvent("on"+b,k);return function(){a.detachEvent("on"+b,k);return!0}}}(),q=[],e=function(a){for(var b=a.clientX,e=a.clientY,f=d("y"),l=d("x"),n,p=q.length;p--;){n=q[p];if(w)for(var r=a.touches&&a.touches.length,u;r--;){if(u=a.touches[r],u.identifier==n.el._drag.id||n.el.node.contains(u.target)){b=
u.clientX;e=u.clientY;(a.originalEvent?a.originalEvent:a).preventDefault();break}}else a.preventDefault();b+=l;e+=f;k("snap.drag.move."+n.el.id,n.move_scope||n.el,b-n.el._drag.x,e-n.el._drag.y,b,e,a)}},l=function(b){a.unmousemove(e).unmouseup(l);for(var d=q.length,f;d--;)f=q[d],f.el._drag={},k("snap.drag.end."+f.el.id,f.end_scope||f.start_scope||f.move_scope||f.el,b);q=[]};for(y=v.length;y--;)(function(d){a[d]=A[d]=function(e,f){a.is(e,"function")&&(this.events=this.events||[],this.events.push({name:d,
f:e,unbind:b(this.node||document,d,e,f||this)}));return this};a["un"+d]=A["un"+d]=function(a){for(var b=this.events||[],e=b.length;e--;)if(b[e].name==d&&(b[e].f==a||!a)){b[e].unbind();b.splice(e,1);!b.length&&delete this.events;break}return this}})(v[y]);A.hover=function(a,b,d,e){return this.mouseover(a,d).mouseout(b,e||d)};A.unhover=function(a,b){return this.unmouseover(a).unmouseout(b)};var r=[];A.drag=function(b,d,f,h,n,p){function u(r,v,w){(r.originalEvent||r).preventDefault();this._drag.x=v;
this._drag.y=w;this._drag.id=r.identifier;!q.length&&a.mousemove(e).mouseup(l);q.push({el:this,move_scope:h,start_scope:n,end_scope:p});d&&k.on("snap.drag.start."+this.id,d);b&&k.on("snap.drag.move."+this.id,b);f&&k.on("snap.drag.end."+this.id,f);k("snap.drag.start."+this.id,n||h||this,v,w,r)}if(!arguments.length){var v;return this.drag(function(a,b){this.attr({transform:v+(v?"T":"t")+[a,b]})},function(){v=this.transform().local})}this._drag={};r.push({el:this,start:u});this.mousedown(u);return this};
A.undrag=function(){for(var b=r.length;b--;)r[b].el==this&&(this.unmousedown(r[b].start),r.splice(b,1),k.unbind("snap.drag.*."+this.id));!r.length&&a.unmousemove(e).unmouseup(l);return this}});C.plugin(function(a,v,y,C){y=y.prototype;var A=/^\s*url\((.+)\)/,w=String,z=a._.$;a.filter={};y.filter=function(d){var f=this;"svg"!=f.type&&(f=f.paper);d=a.parse(w(d));var k=a._.id(),u=z("filter");z(u,{id:k,filterUnits:"userSpaceOnUse"});u.appendChild(d.node);f.defs.appendChild(u);return new v(u)};k.on("snap.util.getattr.filter",
function(){k.stop();var d=z(this.node,"filter");if(d)return(d=w(d).match(A))&&a.select(d[1])});k.on("snap.util.attr.filter",function(d){if(d instanceof v&&"filter"==d.type){k.stop();var f=d.node.id;f||(z(d.node,{id:d.id}),f=d.id);z(this.node,{filter:a.url(f)})}d&&"none"!=d||(k.stop(),this.node.removeAttribute("filter"))});a.filter.blur=function(d,f){null==d&&(d=2);return a.format('<feGaussianBlur stdDeviation="{def}"/>',{def:null==f?d:[d,f]})};a.filter.blur.toString=function(){return this()};a.filter.shadow=
function(d,f,k,u,p){"string"==typeof k&&(p=u=k,k=4);"string"!=typeof u&&(p=u,u="#000");null==k&&(k=4);null==p&&(p=1);null==d&&(d=0,f=2);null==f&&(f=d);u=a.color(u||"#000");return a.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>',
{color:u,dx:d,dy:f,blur:k,opacity:p})};a.filter.shadow.toString=function(){return this()};a.filter.grayscale=function(d){null==d&&(d=1);return a.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>',{a:0.2126+0.7874*(1-d),b:0.7152-0.7152*(1-d),c:0.0722-0.0722*(1-d),d:0.2126-0.2126*(1-d),e:0.7152+0.2848*(1-d),f:0.0722-0.0722*(1-d),g:0.2126-0.2126*(1-d),h:0.0722+0.9278*(1-d)})};a.filter.grayscale.toString=function(){return this()};a.filter.sepia=
function(d){null==d&&(d=1);return a.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>',{a:0.393+0.607*(1-d),b:0.769-0.769*(1-d),c:0.189-0.189*(1-d),d:0.349-0.349*(1-d),e:0.686+0.314*(1-d),f:0.168-0.168*(1-d),g:0.272-0.272*(1-d),h:0.534-0.534*(1-d),i:0.131+0.869*(1-d)})};a.filter.sepia.toString=function(){return this()};a.filter.saturate=function(d){null==d&&(d=1);return a.format('<feColorMatrix type="saturate" values="{amount}"/>',{amount:1-
d})};a.filter.saturate.toString=function(){return this()};a.filter.hueRotate=function(d){return a.format('<feColorMatrix type="hueRotate" values="{angle}"/>',{angle:d||0})};a.filter.hueRotate.toString=function(){return this()};a.filter.invert=function(d){null==d&&(d=1);return a.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>',{amount:d,
amount2:1-d})};a.filter.invert.toString=function(){return this()};a.filter.brightness=function(d){null==d&&(d=1);return a.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>',{amount:d})};a.filter.brightness.toString=function(){return this()};a.filter.contrast=function(d){null==d&&(d=1);return a.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>',
{amount:d,amount2:0.5-d/2})};a.filter.contrast.toString=function(){return this()}});return C});

]]> </script>
<script> <![CDATA[

(function (glob, factory) {
    // AMD support
    if (typeof define === "function" && define.amd) {
        // Define as an anonymous module
        define("Gadfly", ["Snap.svg"], function (Snap) {
            return factory(Snap);
        });
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        glob.Gadfly = factory(glob.Snap);
    }
}(this, function (Snap) {

var Gadfly = {};

// Get an x/y coordinate value in pixels
var xPX = function(fig, x) {
    var client_box = fig.node.getBoundingClientRect();
    return x * fig.node.viewBox.baseVal.width / client_box.width;
};

var yPX = function(fig, y) {
    var client_box = fig.node.getBoundingClientRect();
    return y * fig.node.viewBox.baseVal.height / client_box.height;
};


Snap.plugin(function (Snap, Element, Paper, global) {
    // Traverse upwards from a snap element to find and return the first
    // note with the "plotroot" class.
    Element.prototype.plotroot = function () {
        var element = this;
        while (!element.hasClass("plotroot") && element.parent() != null) {
            element = element.parent();
        }
        return element;
    };

    Element.prototype.svgroot = function () {
        var element = this;
        while (element.node.nodeName != "svg" && element.parent() != null) {
            element = element.parent();
        }
        return element;
    };

    Element.prototype.plotbounds = function () {
        var root = this.plotroot()
        var bbox = root.select(".guide.background").node.getBBox();
        return {
            x0: bbox.x,
            x1: bbox.x + bbox.width,
            y0: bbox.y,
            y1: bbox.y + bbox.height
        };
    };

    Element.prototype.plotcenter = function () {
        var root = this.plotroot()
        var bbox = root.select(".guide.background").node.getBBox();
        return {
            x: bbox.x + bbox.width / 2,
            y: bbox.y + bbox.height / 2
        };
    };

    // Emulate IE style mouseenter/mouseleave events, since Microsoft always
    // does everything right.
    // See: http://www.dynamic-tools.net/toolbox/isMouseLeaveOrEnter/
    var events = ["mouseenter", "mouseleave"];

    for (i in events) {
        (function (event_name) {
            var event_name = events[i];
            Element.prototype[event_name] = function (fn, scope) {
                if (Snap.is(fn, "function")) {
                    var fn2 = function (event) {
                        if (event.type != "mouseover" && event.type != "mouseout") {
                            return;
                        }

                        var reltg = event.relatedTarget ? event.relatedTarget :
                            event.type == "mouseout" ? event.toElement : event.fromElement;
                        while (reltg && reltg != this.node) reltg = reltg.parentNode;

                        if (reltg != this.node) {
                            return fn.apply(this, event);
                        }
                    };

                    if (event_name == "mouseenter") {
                        this.mouseover(fn2, scope);
                    } else {
                        this.mouseout(fn2, scope);
                    }
                }
                return this;
            };
        })(events[i]);
    }


    Element.prototype.mousewheel = function (fn, scope) {
        if (Snap.is(fn, "function")) {
            var el = this;
            var fn2 = function (event) {
                fn.apply(el, [event]);
            };
        }

        this.node.addEventListener(
            /Firefox/i.test(navigator.userAgent) ? "DOMMouseScroll" : "mousewheel",
            fn2);

        return this;
    };


    // Snap's attr function can be too slow for things like panning/zooming.
    // This is a function to directly update element attributes without going
    // through eve.
    Element.prototype.attribute = function(key, val) {
        if (val === undefined) {
            return this.node.getAttribute(key);
        } else {
            this.node.setAttribute(key, val);
            return this;
        }
    };

    Element.prototype.init_gadfly = function() {
        this.mouseenter(Gadfly.plot_mouseover)
            .mouseleave(Gadfly.plot_mouseout)
            .dblclick(Gadfly.plot_dblclick)
            .mousewheel(Gadfly.guide_background_scroll)
            .drag(Gadfly.guide_background_drag_onmove,
                  Gadfly.guide_background_drag_onstart,
                  Gadfly.guide_background_drag_onend);
        this.mouseenter(function (event) {
            init_pan_zoom(this.plotroot());
        });
        return this;
    };
});


// When the plot is moused over, emphasize the grid lines.
Gadfly.plot_mouseover = function(event) {
    var root = this.plotroot();

    var keyboard_zoom = function(event) {
        if (event.which == 187) { // plus
            increase_zoom_by_position(root, 0.1, true);
        } else if (event.which == 189) { // minus
            increase_zoom_by_position(root, -0.1, true);
        }
    };
    root.data("keyboard_zoom", keyboard_zoom);
    window.addEventListener("keyup", keyboard_zoom);

    var xgridlines = root.select(".xgridlines"),
        ygridlines = root.select(".ygridlines");

    xgridlines.data("unfocused_strokedash",
                    xgridlines.attribute("stroke-dasharray").replace(/(\d)(,|$)/g, "$1mm$2"));
    ygridlines.data("unfocused_strokedash",
                    ygridlines.attribute("stroke-dasharray").replace(/(\d)(,|$)/g, "$1mm$2"));

    // emphasize grid lines
    var destcolor = root.data("focused_xgrid_color");
    xgridlines.attribute("stroke-dasharray", "none")
              .selectAll("path")
              .animate({stroke: destcolor}, 250);

    destcolor = root.data("focused_ygrid_color");
    ygridlines.attribute("stroke-dasharray", "none")
              .selectAll("path")
              .animate({stroke: destcolor}, 250);

    // reveal zoom slider
    root.select(".zoomslider")
        .animate({opacity: 1.0}, 250);
};

// Reset pan and zoom on double click
Gadfly.plot_dblclick = function(event) {
  set_plot_pan_zoom(this.plotroot(), 0.0, 0.0, 1.0);
};

// Unemphasize grid lines on mouse out.
Gadfly.plot_mouseout = function(event) {
    var root = this.plotroot();

    window.removeEventListener("keyup", root.data("keyboard_zoom"));
    root.data("keyboard_zoom", undefined);

    var xgridlines = root.select(".xgridlines"),
        ygridlines = root.select(".ygridlines");

    var destcolor = root.data("unfocused_xgrid_color");

    xgridlines.attribute("stroke-dasharray", xgridlines.data("unfocused_strokedash"))
              .selectAll("path")
              .animate({stroke: destcolor}, 250);

    destcolor = root.data("unfocused_ygrid_color");
    ygridlines.attribute("stroke-dasharray", ygridlines.data("unfocused_strokedash"))
              .selectAll("path")
              .animate({stroke: destcolor}, 250);

    // hide zoom slider
    root.select(".zoomslider")
        .animate({opacity: 0.0}, 250);
};


var set_geometry_transform = function(root, tx, ty, scale) {
    var xscalable = root.hasClass("xscalable"),
        yscalable = root.hasClass("yscalable");

    var old_scale = root.data("scale");

    var xscale = xscalable ? scale : 1.0,
        yscale = yscalable ? scale : 1.0;

    tx = xscalable ? tx : 0.0;
    ty = yscalable ? ty : 0.0;

    var t = new Snap.Matrix().translate(tx, ty).scale(xscale, yscale);

    root.selectAll(".geometry, image")
        .forEach(function (element, i) {
            element.transform(t);
        });

    bounds = root.plotbounds();

    if (yscalable) {
        var xfixed_t = new Snap.Matrix().translate(0, ty).scale(1.0, yscale);
        root.selectAll(".xfixed")
            .forEach(function (element, i) {
                element.transform(xfixed_t);
            });

        root.select(".ylabels")
            .transform(xfixed_t)
            .selectAll("text")
            .forEach(function (element, i) {
                if (element.attribute("gadfly:inscale") == "true") {
                    var cx = element.asPX("x"),
                        cy = element.asPX("y");
                    var st = element.data("static_transform");
                    unscale_t = new Snap.Matrix();
                    unscale_t.scale(1, 1/scale, cx, cy).add(st);
                    element.transform(unscale_t);

                    var y = cy * scale + ty;
                    element.attr("visibility",
                        bounds.y0 <= y && y <= bounds.y1 ? "visible" : "hidden");
                }
            });
    }

    if (xscalable) {
        var yfixed_t = new Snap.Matrix().translate(tx, 0).scale(xscale, 1.0);
        var xtrans = new Snap.Matrix().translate(tx, 0);
        root.selectAll(".yfixed")
            .forEach(function (element, i) {
                element.transform(yfixed_t);
            });

        root.select(".xlabels")
            .transform(yfixed_t)
            .selectAll("text")
            .forEach(function (element, i) {
                if (element.attribute("gadfly:inscale") == "true") {
                    var cx = element.asPX("x"),
                        cy = element.asPX("y");
                    var st = element.data("static_transform");
                    unscale_t = new Snap.Matrix();
                    unscale_t.scale(1/scale, 1, cx, cy).add(st);

                    element.transform(unscale_t);

                    var x = cx * scale + tx;
                    element.attr("visibility",
                        bounds.x0 <= x && x <= bounds.x1 ? "visible" : "hidden");
                    }
            });
    }

    // we must unscale anything that is scale invariance: widths, raiduses, etc.
    var size_attribs = ["font-size"];
    var unscaled_selection = ".geometry, .geometry *";
    if (xscalable) {
        size_attribs.push("rx");
        unscaled_selection += ", .xgridlines";
    }
    if (yscalable) {
        size_attribs.push("ry");
        unscaled_selection += ", .ygridlines";
    }

    root.selectAll(unscaled_selection)
        .forEach(function (element, i) {
            // circle need special help
            if (element.node.nodeName == "circle") {
                var cx = element.attribute("cx"),
                    cy = element.attribute("cy");
                unscale_t = new Snap.Matrix().scale(1/xscale, 1/yscale,
                                                        cx, cy);
                element.transform(unscale_t);
                return;
            }

            for (i in size_attribs) {
                var key = size_attribs[i];
                var val = parseFloat(element.attribute(key));
                if (val !== undefined && val != 0 && !isNaN(val)) {
                    element.attribute(key, val * old_scale / scale);
                }
            }
        });
};


// Find the most appropriate tick scale and update label visibility.
var update_tickscale = function(root, scale, axis) {
    if (!root.hasClass(axis + "scalable")) return;

    var tickscales = root.data(axis + "tickscales");
    var best_tickscale = 1.0;
    var best_tickscale_dist = Infinity;
    for (tickscale in tickscales) {
        var dist = Math.abs(Math.log(tickscale) - Math.log(scale));
        if (dist < best_tickscale_dist) {
            best_tickscale_dist = dist;
            best_tickscale = tickscale;
        }
    }

    if (best_tickscale != root.data(axis + "tickscale")) {
        root.data(axis + "tickscale", best_tickscale);
        var mark_inscale_gridlines = function (element, i) {
            var inscale = element.attr("gadfly:scale") == best_tickscale;
            element.attribute("gadfly:inscale", inscale);
            element.attr("visibility", inscale ? "visible" : "hidden");
        };

        var mark_inscale_labels = function (element, i) {
            var inscale = element.attr("gadfly:scale") == best_tickscale;
            element.attribute("gadfly:inscale", inscale);
            element.attr("visibility", inscale ? "visible" : "hidden");
        };

        root.select("." + axis + "gridlines").selectAll("path").forEach(mark_inscale_gridlines);
        root.select("." + axis + "labels").selectAll("text").forEach(mark_inscale_labels);
    }
};


var set_plot_pan_zoom = function(root, tx, ty, scale) {
    var old_scale = root.data("scale");
    var bounds = root.plotbounds();

    var width = bounds.x1 - bounds.x0,
        height = bounds.y1 - bounds.y0;

    // compute the viewport derived from tx, ty, and scale
    var x_min = -width * scale - (scale * width - width),
        x_max = width * scale,
        y_min = -height * scale - (scale * height - height),
        y_max = height * scale;

    var x0 = bounds.x0 - scale * bounds.x0,
        y0 = bounds.y0 - scale * bounds.y0;

    var tx = Math.max(Math.min(tx - x0, x_max), x_min),
        ty = Math.max(Math.min(ty - y0, y_max), y_min);

    tx += x0;
    ty += y0;

    // when the scale change, we may need to alter which set of
    // ticks is being displayed
    if (scale != old_scale) {
        update_tickscale(root, scale, "x");
        update_tickscale(root, scale, "y");
    }

    set_geometry_transform(root, tx, ty, scale);

    root.data("scale", scale);
    root.data("tx", tx);
    root.data("ty", ty);
};


var scale_centered_translation = function(root, scale) {
    var bounds = root.plotbounds();

    var width = bounds.x1 - bounds.x0,
        height = bounds.y1 - bounds.y0;

    var tx0 = root.data("tx"),
        ty0 = root.data("ty");

    var scale0 = root.data("scale");

    // how off from center the current view is
    var xoff = tx0 - (bounds.x0 * (1 - scale0) + (width * (1 - scale0)) / 2),
        yoff = ty0 - (bounds.y0 * (1 - scale0) + (height * (1 - scale0)) / 2);

    // rescale offsets
    xoff = xoff * scale / scale0;
    yoff = yoff * scale / scale0;

    // adjust for the panel position being scaled
    var x_edge_adjust = bounds.x0 * (1 - scale),
        y_edge_adjust = bounds.y0 * (1 - scale);

    return {
        x: xoff + x_edge_adjust + (width - width * scale) / 2,
        y: yoff + y_edge_adjust + (height - height * scale) / 2
    };
};


// Initialize data for panning zooming if it isn't already.
var init_pan_zoom = function(root) {
    if (root.data("zoompan-ready")) {
        return;
    }

    // The non-scaling-stroke trick. Rather than try to correct for the
    // stroke-width when zooming, we force it to a fixed value.
    var px_per_mm = root.node.getCTM().a;

    // Drag events report deltas in pixels, which we'd like to convert to
    // millimeters.
    root.data("px_per_mm", px_per_mm);

    root.selectAll("path")
        .forEach(function (element, i) {
        sw = element.asPX("stroke-width") * px_per_mm;
        if (sw > 0) {
            element.attribute("stroke-width", sw);
            element.attribute("vector-effect", "non-scaling-stroke");
        }
    });

    // Store ticks labels original tranformation
    root.selectAll(".xlabels > text, .ylabels > text")
        .forEach(function (element, i) {
            var lm = element.transform().localMatrix;
            element.data("static_transform",
                new Snap.Matrix(lm.a, lm.b, lm.c, lm.d, lm.e, lm.f));
        });

    var xgridlines = root.select(".xgridlines");
    var ygridlines = root.select(".ygridlines");
    var xlabels = root.select(".xlabels");
    var ylabels = root.select(".ylabels");

    if (root.data("tx") === undefined) root.data("tx", 0);
    if (root.data("ty") === undefined) root.data("ty", 0);
    if (root.data("scale") === undefined) root.data("scale", 1.0);
    if (root.data("xtickscales") === undefined) {

        // index all the tick scales that are listed
        var xtickscales = {};
        var ytickscales = {};
        var add_x_tick_scales = function (element, i) {
            xtickscales[element.attribute("gadfly:scale")] = true;
        };
        var add_y_tick_scales = function (element, i) {
            ytickscales[element.attribute("gadfly:scale")] = true;
        };

        if (xgridlines) xgridlines.selectAll("path").forEach(add_x_tick_scales);
        if (ygridlines) ygridlines.selectAll("path").forEach(add_y_tick_scales);
        if (xlabels) xlabels.selectAll("text").forEach(add_x_tick_scales);
        if (ylabels) ylabels.selectAll("text").forEach(add_y_tick_scales);

        root.data("xtickscales", xtickscales);
        root.data("ytickscales", ytickscales);
        root.data("xtickscale", 1.0);
    }

    var min_scale = 1.0, max_scale = 1.0;
    for (scale in xtickscales) {
        min_scale = Math.min(min_scale, scale);
        max_scale = Math.max(max_scale, scale);
    }
    for (scale in ytickscales) {
        min_scale = Math.min(min_scale, scale);
        max_scale = Math.max(max_scale, scale);
    }
    root.data("min_scale", min_scale);
    root.data("max_scale", max_scale);

    // store the original positions of labels
    if (xlabels) {
        xlabels.selectAll("text")
               .forEach(function (element, i) {
                   element.data("x", element.asPX("x"));
               });
    }

    if (ylabels) {
        ylabels.selectAll("text")
               .forEach(function (element, i) {
                   element.data("y", element.asPX("y"));
               });
    }

    // mark grid lines and ticks as in or out of scale.
    var mark_inscale = function (element, i) {
        element.attribute("gadfly:inscale", element.attribute("gadfly:scale") == 1.0);
    };

    if (xgridlines) xgridlines.selectAll("path").forEach(mark_inscale);
    if (ygridlines) ygridlines.selectAll("path").forEach(mark_inscale);
    if (xlabels) xlabels.selectAll("text").forEach(mark_inscale);
    if (ylabels) ylabels.selectAll("text").forEach(mark_inscale);

    // figure out the upper ond lower bounds on panning using the maximum
    // and minum grid lines
    var bounds = root.plotbounds();
    var pan_bounds = {
        x0: 0.0,
        y0: 0.0,
        x1: 0.0,
        y1: 0.0
    };

    if (xgridlines) {
        xgridlines
            .selectAll("path")
            .forEach(function (element, i) {
                if (element.attribute("gadfly:inscale") == "true") {
                    var bbox = element.node.getBBox();
                    if (bounds.x1 - bbox.x < pan_bounds.x0) {
                        pan_bounds.x0 = bounds.x1 - bbox.x;
                    }
                    if (bounds.x0 - bbox.x > pan_bounds.x1) {
                        pan_bounds.x1 = bounds.x0 - bbox.x;
                    }
                    element.attr("visibility", "visible");
                }
            });
    }

    if (ygridlines) {
        ygridlines
            .selectAll("path")
            .forEach(function (element, i) {
                if (element.attribute("gadfly:inscale") == "true") {
                    var bbox = element.node.getBBox();
                    if (bounds.y1 - bbox.y < pan_bounds.y0) {
                        pan_bounds.y0 = bounds.y1 - bbox.y;
                    }
                    if (bounds.y0 - bbox.y > pan_bounds.y1) {
                        pan_bounds.y1 = bounds.y0 - bbox.y;
                    }
                    element.attr("visibility", "visible");
                }
            });
    }

    // nudge these values a little
    pan_bounds.x0 -= 5;
    pan_bounds.x1 += 5;
    pan_bounds.y0 -= 5;
    pan_bounds.y1 += 5;
    root.data("pan_bounds", pan_bounds);

    root.data("zoompan-ready", true)
};


// drag actions, i.e. zooming and panning
var pan_action = {
    start: function(root, x, y, event) {
        root.data("dx", 0);
        root.data("dy", 0);
        root.data("tx0", root.data("tx"));
        root.data("ty0", root.data("ty"));
    },
    update: function(root, dx, dy, x, y, event) {
        var px_per_mm = root.data("px_per_mm");
        dx /= px_per_mm;
        dy /= px_per_mm;

        var tx0 = root.data("tx"),
            ty0 = root.data("ty");

        var dx0 = root.data("dx"),
            dy0 = root.data("dy");

        root.data("dx", dx);
        root.data("dy", dy);

        dx = dx - dx0;
        dy = dy - dy0;

        var tx = tx0 + dx,
            ty = ty0 + dy;

        set_plot_pan_zoom(root, tx, ty, root.data("scale"));
    },
    end: function(root, event) {

    },
    cancel: function(root) {
        set_plot_pan_zoom(root, root.data("tx0"), root.data("ty0"), root.data("scale"));
    }
};

var zoom_box;
var zoom_action = {
    start: function(root, x, y, event) {
        var bounds = root.plotbounds();
        var width = bounds.x1 - bounds.x0,
            height = bounds.y1 - bounds.y0;
        var ratio = width / height;
        var xscalable = root.hasClass("xscalable"),
            yscalable = root.hasClass("yscalable");
        var px_per_mm = root.data("px_per_mm");
        x = xscalable ? x / px_per_mm : bounds.x0;
        y = yscalable ? y / px_per_mm : bounds.y0;
        var w = xscalable ? 0 : width;
        var h = yscalable ? 0 : height;
        zoom_box = root.rect(x, y, w, h).attr({
            "fill": "#000",
            "opacity": 0.25
        });
        zoom_box.data("ratio", ratio);
    },
    update: function(root, dx, dy, x, y, event) {
        var xscalable = root.hasClass("xscalable"),
            yscalable = root.hasClass("yscalable");
        var px_per_mm = root.data("px_per_mm");
        var bounds = root.plotbounds();
        if (yscalable) {
            y /= px_per_mm;
            y = Math.max(bounds.y0, y);
            y = Math.min(bounds.y1, y);
        } else {
            y = bounds.y1;
        }
        if (xscalable) {
            x /= px_per_mm;
            x = Math.max(bounds.x0, x);
            x = Math.min(bounds.x1, x);
        } else {
            x = bounds.x1;
        }

        dx = x - zoom_box.attr("x");
        dy = y - zoom_box.attr("y");
        if (xscalable && yscalable) {
            var ratio = zoom_box.data("ratio");
            var width = Math.min(Math.abs(dx), ratio * Math.abs(dy));
            var height = Math.min(Math.abs(dy), Math.abs(dx) / ratio);
            dx = width * dx / Math.abs(dx);
            dy = height * dy / Math.abs(dy);
        }
        var xoffset = 0,
            yoffset = 0;
        if (dx < 0) {
            xoffset = dx;
            dx = -1 * dx;
        }
        if (dy < 0) {
            yoffset = dy;
            dy = -1 * dy;
        }
        if (isNaN(dy)) {
            dy = 0.0;
        }
        if (isNaN(dx)) {
            dx = 0.0;
        }
        zoom_box.transform("T" + xoffset + "," + yoffset);
        zoom_box.attr("width", dx);
        zoom_box.attr("height", dy);
    },
    end: function(root, event) {
        var xscalable = root.hasClass("xscalable"),
            yscalable = root.hasClass("yscalable");
        var zoom_bounds = zoom_box.getBBox();
        if (zoom_bounds.width * zoom_bounds.height <= 0) {
            return;
        }
        var plot_bounds = root.plotbounds();
        var zoom_factor = 1.0;
        if (yscalable) {
            zoom_factor = (plot_bounds.y1 - plot_bounds.y0) / zoom_bounds.height;
        } else {
            zoom_factor = (plot_bounds.x1 - plot_bounds.x0) / zoom_bounds.width;
        }
        var tx = (root.data("tx") - zoom_bounds.x) * zoom_factor + plot_bounds.x0,
            ty = (root.data("ty") - zoom_bounds.y) * zoom_factor + plot_bounds.y0;
        set_plot_pan_zoom(root, tx, ty, root.data("scale") * zoom_factor);
        zoom_box.remove();
    },
    cancel: function(root) {
        zoom_box.remove();
    }
};


Gadfly.guide_background_drag_onstart = function(x, y, event) {
    var root = this.plotroot();
    var scalable = root.hasClass("xscalable") || root.hasClass("yscalable");
    var zoomable = !event.altKey && !event.ctrlKey && event.shiftKey && scalable;
    var panable = !event.altKey && !event.ctrlKey && !event.shiftKey && scalable;
    var drag_action = zoomable ? zoom_action :
                      panable  ? pan_action :
                                 undefined;
    root.data("drag_action", drag_action);
    if (drag_action) {
        var cancel_drag_action = function(event) {
            if (event.which == 27) { // esc key
                drag_action.cancel(root);
                root.data("drag_action", undefined);
            }
        };
        window.addEventListener("keyup", cancel_drag_action);
        root.data("cancel_drag_action", cancel_drag_action);
        drag_action.start(root, x, y, event);
    }
};


Gadfly.guide_background_drag_onmove = function(dx, dy, x, y, event) {
    var root = this.plotroot();
    var drag_action = root.data("drag_action");
    if (drag_action) {
        drag_action.update(root, dx, dy, x, y, event);
    }
};


Gadfly.guide_background_drag_onend = function(event) {
    var root = this.plotroot();
    window.removeEventListener("keyup", root.data("cancel_drag_action"));
    root.data("cancel_drag_action", undefined);
    var drag_action = root.data("drag_action");
    if (drag_action) {
        drag_action.end(root, event);
    }
    root.data("drag_action", undefined);
};


Gadfly.guide_background_scroll = function(event) {
    if (event.shiftKey) {
        increase_zoom_by_position(this.plotroot(), 0.001 * event.wheelDelta);
        event.preventDefault();
    }
};


Gadfly.zoomslider_button_mouseover = function(event) {
    this.select(".button_logo")
         .animate({fill: this.data("mouseover_color")}, 100);
};


Gadfly.zoomslider_button_mouseout = function(event) {
     this.select(".button_logo")
         .animate({fill: this.data("mouseout_color")}, 100);
};


Gadfly.zoomslider_zoomout_click = function(event) {
    increase_zoom_by_position(this.plotroot(), -0.1, true);
};


Gadfly.zoomslider_zoomin_click = function(event) {
    increase_zoom_by_position(this.plotroot(), 0.1, true);
};


Gadfly.zoomslider_track_click = function(event) {
    // TODO
};


// Map slider position x to scale y using the function y = a*exp(b*x)+c.
// The constants a, b, and c are solved using the constraint that the function
// should go through the points (0; min_scale), (0.5; 1), and (1; max_scale).
var scale_from_slider_position = function(position, min_scale, max_scale) {
    var a = (1 - 2 * min_scale + min_scale * min_scale) / (min_scale + max_scale - 2),
        b = 2 * Math.log((max_scale - 1) / (1 - min_scale)),
        c = (min_scale * max_scale - 1) / (min_scale + max_scale - 2);
    return a * Math.exp(b * position) + c;
}

// inverse of scale_from_slider_position
var slider_position_from_scale = function(scale, min_scale, max_scale) {
    var a = (1 - 2 * min_scale + min_scale * min_scale) / (min_scale + max_scale - 2),
        b = 2 * Math.log((max_scale - 1) / (1 - min_scale)),
        c = (min_scale * max_scale - 1) / (min_scale + max_scale - 2);
    return 1 / b * Math.log((scale - c) / a);
}

var increase_zoom_by_position = function(root, delta_position, animate) {
    var scale = root.data("scale"),
        min_scale = root.data("min_scale"),
        max_scale = root.data("max_scale");
    var position = slider_position_from_scale(scale, min_scale, max_scale);
    position += delta_position;
    scale = scale_from_slider_position(position, min_scale, max_scale);
    set_zoom(root, scale, animate);
}

var set_zoom = function(root, scale, animate) {
    var min_scale = root.data("min_scale"),
        max_scale = root.data("max_scale"),
        old_scale = root.data("scale");
    var new_scale = Math.max(min_scale, Math.min(scale, max_scale));
    if (animate) {
        Snap.animate(
            old_scale,
            new_scale,
            function (new_scale) {
                update_plot_scale(root, new_scale);
            },
            200);
    } else {
        update_plot_scale(root, new_scale);
    }
}


var update_plot_scale = function(root, new_scale) {
    var trans = scale_centered_translation(root, new_scale);
    set_plot_pan_zoom(root, trans.x, trans.y, new_scale);

    root.selectAll(".zoomslider_thumb")
        .forEach(function (element, i) {
            var min_pos = element.data("min_pos"),
                max_pos = element.data("max_pos"),
                min_scale = root.data("min_scale"),
                max_scale = root.data("max_scale");
            var xmid = (min_pos + max_pos) / 2;
            var xpos = slider_position_from_scale(new_scale, min_scale, max_scale);
            element.transform(new Snap.Matrix().translate(
                Math.max(min_pos, Math.min(
                         max_pos, min_pos + (max_pos - min_pos) * xpos)) - xmid, 0));
    });
};


Gadfly.zoomslider_thumb_dragmove = function(dx, dy, x, y, event) {
    var root = this.plotroot();
    var min_pos = this.data("min_pos"),
        max_pos = this.data("max_pos"),
        min_scale = root.data("min_scale"),
        max_scale = root.data("max_scale"),
        old_scale = root.data("old_scale");

    var px_per_mm = root.data("px_per_mm");
    dx /= px_per_mm;
    dy /= px_per_mm;

    var xmid = (min_pos + max_pos) / 2;
    var xpos = slider_position_from_scale(old_scale, min_scale, max_scale) +
                   dx / (max_pos - min_pos);

    // compute the new scale
    var new_scale = scale_from_slider_position(xpos, min_scale, max_scale);
    new_scale = Math.min(max_scale, Math.max(min_scale, new_scale));

    update_plot_scale(root, new_scale);
    event.stopPropagation();
};


Gadfly.zoomslider_thumb_dragstart = function(x, y, event) {
    this.animate({fill: this.data("mouseover_color")}, 100);
    var root = this.plotroot();

    // keep track of what the scale was when we started dragging
    root.data("old_scale", root.data("scale"));
    event.stopPropagation();
};


Gadfly.zoomslider_thumb_dragend = function(event) {
    this.animate({fill: this.data("mouseout_color")}, 100);
    event.stopPropagation();
};


var toggle_color_class = function(root, color_class, ison) {
    var guides = root.selectAll(".guide." + color_class + ",.guide ." + color_class);
    var geoms = root.selectAll(".geometry." + color_class + ",.geometry ." + color_class);
    if (ison) {
        guides.animate({opacity: 0.5}, 250);
        geoms.animate({opacity: 0.0}, 250);
    } else {
        guides.animate({opacity: 1.0}, 250);
        geoms.animate({opacity: 1.0}, 250);
    }
};


Gadfly.colorkey_swatch_click = function(event) {
    var root = this.plotroot();
    var color_class = this.data("color_class");

    if (event.shiftKey) {
        root.selectAll(".colorkey text")
            .forEach(function (element) {
                var other_color_class = element.data("color_class");
                if (other_color_class != color_class) {
                    toggle_color_class(root, other_color_class,
                                       element.attr("opacity") == 1.0);
                }
            });
    } else {
        toggle_color_class(root, color_class, this.attr("opacity") == 1.0);
    }
};


return Gadfly;

}));


//@ sourceURL=gadfly.js

(function (glob, factory) {
    // AMD support
      if (typeof require === "function" && typeof define === "function" && define.amd) {
        require(["Snap.svg", "Gadfly"], function (Snap, Gadfly) {
            factory(Snap, Gadfly);
        });
      } else {
          factory(glob.Snap, glob.Gadfly);
      }
})(window, function (Snap, Gadfly) {
    var fig = Snap("#fig-0378e04b897742b597befd2e8e1c169e");
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-8")
   .init_gadfly();
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-11")
   .plotroot().data("unfocused_ygrid_color", "#D0D0E0")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-11")
   .plotroot().data("focused_ygrid_color", "#A0A0A0")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-12")
   .plotroot().data("unfocused_xgrid_color", "#D0D0E0")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-12")
   .plotroot().data("focused_xgrid_color", "#A0A0A0")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-16")
   .data("mouseover_color", "#CD5C5C")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-16")
   .data("mouseout_color", "#6A6A6A")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-16")
   .click(Gadfly.zoomslider_zoomin_click)
.mouseenter(Gadfly.zoomslider_button_mouseover)
.mouseleave(Gadfly.zoomslider_button_mouseout)
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-18")
   .data("max_pos", 111.58)
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-18")
   .data("min_pos", 94.58)
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-18")
   .click(Gadfly.zoomslider_track_click);
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-19")
   .data("max_pos", 111.58)
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-19")
   .data("min_pos", 94.58)
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-19")
   .data("mouseover_color", "#CD5C5C")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-19")
   .data("mouseout_color", "#6A6A6A")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-19")
   .drag(Gadfly.zoomslider_thumb_dragmove,
     Gadfly.zoomslider_thumb_dragstart,
     Gadfly.zoomslider_thumb_dragend)
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-20")
   .data("mouseover_color", "#CD5C5C")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-20")
   .data("mouseout_color", "#6A6A6A")
;
fig.select("#fig-0378e04b897742b597befd2e8e1c169e-element-20")
   .click(Gadfly.zoomslider_zoomout_click)
.mouseenter(Gadfly.zoomslider_button_mouseover)
.mouseleave(Gadfly.zoomslider_button_mouseout)
;
    });
]]> </script>
</svg>




### Final simulation

We're now going to actually build out the full motion that we'll use for computing the pricing of our autocallable products. It will be largely the same, but we will use far more sample paths for the simulation.


```julia
full_simulation = function(S0, T, n, m, term)
    forward = vcat(term[1], forward_term(term))

    # And an S0 to kick things off.
    final_motion = ones(m) * S0
    for i=1:T
        μ = (forward[i] - 1 - q)
        year_motion = simulate_gbm(final_motion[:,end], μ, σ, 1, n)
        final_motion = hcat(final_motion, year_motion)
    end
    return final_motion
end

tic()
full_simulation(S0, T, n, m, term)
time = toq()
@printf("Time to run simulation: %.2fs", time)
```

    Time to run simulation: 5.34s

## Athena Simulation

Now that we've defined our underlying simulation, let's actually try and price an Athena note. Athena has the following characteristics:

- Automatically called if the underlying is above the **call barrier** at observation
- Accelerated coupon paid if the underlying is above the **call barrier** at observation
    - The coupon paid is $c \cdot i$ with $i$ as the current year, and $c$ the coupon rate
- Principle protection up until a **protection barrier** at observation; All principle at risk if this barrier not met
- Observed yearly


```julia
call_barrier = S0
strike = S0
protection_barrier = S0 * .6
coupon = nominal * .07

price_athena = function(initial_price, year_prices, call_barrier,
        protection_barrier, coupon, forward_structure)

    total_coupons = 0
    
    t = length(year_prices)

    for i=1:t
        price = year_prices[i]
        if price ≥ call_barrier
            return (nominal + coupon*i) * exp((prod(forward_structure[i:end])-1)*(t-i))
        end
    end

    # We've reached maturity, time to check capital protection
    if year_prices[end] > protection_barrier
        return nominal
    else
        put = (strike - year_prices[end]) / strike
        return nominal*(1-put)
    end
end

forward_structure = forward_term(term)
price_function = (year_prices) -> price_athena(S0, year_prices,
    call_barrier, protection_barrier, coupon, forward_structure)

athena = function()
    year_indexes = [n*i for i=1:T]
    motion = full_simulation(S0, T, n, m, term)
    payoffs = [price_function(motion[i, year_indexes]) for i=1:m]
    return mean(payoffs)
end

mean_payoffs = zeros(num_simulations)
for i=1:num_simulations
    tic()
    mean_payoffs[i] = athena()
    time = toq()
    @printf("Mean of simulation %i: \$%.4f; Simulation time: %.2fs\n", i, mean_payoffs[i], time)
end

final_mean = mean(mean_payoffs)
println("Mean over $num_simulations simulations: $(mean(mean_payoffs))")
pv = final_mean * (exp(-(prod(forward_structure)-1)*T))
@printf("Present value of Athena note: \$%.2f, notional: \$%.2f", pv, nominal)
```

    Mean of simulation 1: $103.2805; Simulation time: 5.59s
    Mean of simulation 2: $103.3796; Simulation time: 5.05s
    Mean of simulation 3: $103.4752; Simulation time: 5.18s
    Mean of simulation 4: $103.4099; Simulation time: 5.37s
    Mean of simulation 5: $103.3260; Simulation time: 5.32s
    Mean over 5 simulations: 103.37421610015554
    Present value of Athena note: $95.00, notional: $100.00

## Phoenix without Memory Simulation

Let's move into pricing a Phoenix without memory. It's very similar to the Athena production, with the exception that we introduce a coupon barrier so coupons are paid even when the underlying is below the initial price.

The Phoenix product has the following characteristics (example [here](https://www.rbccm.com/usstructurednotes/file-780079.pdf)):

- Automatically called if the underlying is above the **call barrier** at observation
- Coupon paid if the underlying is above a **coupon barrier** at observation
- Principle protection up until a **protection barrier** at observation; All principle at risk if this barrier not met
- Observed yearly

Some example paths (all assume that a call barrier of the current price, and coupon barrier some level below that):

- At the end of year 1, the stock is above the call barrier; the note is called and you receive the value of the stock plus the coupon being paid.
- At the end of year 1, the stock is above the coupon barrier, but not the call barrier; you receive the coupon. At the end of year 2, the stock is below the coupon barrier; you receive nothing. At the end of year 3, the stock is above the call barrier; the note is called and you receive the value of the stock plus a coupon for year 3.

We're going to re-use the same simulation, with the following parameters:

- Call barrier: 100%
- Coupon barrier: 70%
- Coupon: 6%
- Capital protection until 70% (at maturity)


```julia
call_barrier = S0
coupon_barrier = S0 * .8
protection_barrier = S0 * .6
coupon = nominal * .06

price_phoenix_no_memory = function(initial_price, year_prices, call_barrier, coupon_barrier,
        protection_barrier, coupon, forward_structure)

    total_coupons = 0
    t = length(year_prices)

    for i=1:t
        price = year_prices[i]
        if price ≥ call_barrier
            return (nominal + coupon + total_coupons)*exp((prod(forward_structure[i:end])-1)*(t-i))
        elseif price ≥ coupon_barrier
            total_coupons = total_coupons * exp(forward_structure[i]-1) + coupon
        else
            total_coupons *= exp(forward_structure[i]-1)
        end
    end

    # We've reached maturity, time to check capital protection
    if year_prices[end] > protection_barrier
        return nominal + total_coupons
    else
        put = (strike - year_prices[end]) / strike
        return nominal*(1-put)
    end
end

forward_structure = forward_term(term)
price_function = (year_prices) -> price_phoenix_no_memory(S0, year_prices,
    call_barrier, coupon_barrier, protection_barrier, coupon, forward_structure)

phoenix_no_memory = function()
    year_indexes = [n*i for i=1:T]
    motion = full_simulation(S0, T, n, m, term)
    payoffs = [price_function(motion[i, year_indexes]) for i=1:m]
    return mean(payoffs)
end

mean_payoffs = zeros(num_simulations)
for i=1:num_simulations
    tic()
    mean_payoffs[i] = phoenix_no_memory()
    time = toq()
    @printf("Mean of simulation %i: \$%.4f; Simulation time: %.2fs\n", i, mean_payoffs[i], time)
end

final_mean = mean(mean_payoffs)
println("Mean over $num_simulations simulations: $(mean(mean_payoffs))")
pv = final_mean * exp(-(prod(forward_structure)-1)*(T))
@printf("Present value of Phoenix without memory note: \$%.2f", pv)
```

    Mean of simulation 1: $106.0562; Simulation time: 5.72s
    Mean of simulation 2: $106.0071; Simulation time: 5.85s
    Mean of simulation 3: $105.9959; Simulation time: 5.87s
    Mean of simulation 4: $106.0665; Simulation time: 5.93s
    Mean of simulation 5: $106.0168; Simulation time: 5.81s
    Mean over 5 simulations: 106.02850857209883
    Present value of Phoenix without memory note: $97.44

## Phoenix with Memory Simulation

The Phoenix with Memory structure is very similar to the Phoenix, but as the name implies, has a special "memory" property: **It remembers any coupons that haven't been paid at prior observation times, and pays them all if the underlying crosses the coupon barrier**. For example:
- Note issued with 100% call barrier, 70% coupon barrier. At year 1, the underlying is at 50%, so no coupons are paid. At year 2, the underlying is at 80%, so coupons for both year 1 and 2 are paid, resulting in a double coupon.

You can also find an example [here](https://www.rbccm.com/usstructurednotes/file-781232.pdf).

Let's go ahead and set up the simulation! The parameters will be the same, but we can expect that the value will go up because of the memory attribute


```julia
call_barrier = S0
coupon_barrier = S0 * .8
protection_barrier = S0 * .6
coupon = nominal * .07

price_phoenix_with_memory = function(initial_price, year_prices, call_barrier,
    coupon_barrier, protection_barrier, coupon, forward_structure)

    last_coupon = 0
    total_coupons = 0
    
    t = length(year_prices)

    for i=1:t
        price = year_prices[i]
        if price > call_barrier
            return (nominal + coupon + total_coupons)*exp((prod(forward_structure[i:end])-1)*(t-i))
        elseif price > coupon_barrier
            ####################################################################
            # The only difference between with/without memory is the below lines
            memory_coupons = (i - last_coupon) * coupon
            last_coupon = i
            total_coupons = total_coupons * exp(forward_structure[i]-1) + memory_coupons
            ####################################################################
        else
            total_coupons *= exp(forward_structure[i]-1)
        end
    end

    # We've reached maturity, time to check capital protection
    if year_prices[end] > protection_barrier
        return nominal + total_coupons
    else
        put = (strike - year_prices[end]) / strike
        return nominal*(1-put)
    end
end

forward_structure = forward_term(term)
price_function = (year_prices) -> price_phoenix_with_memory(S0, year_prices,
    call_barrier, coupon_barrier, protection_barrier, coupon, forward_structure)

phoenix_with_memory = function()
    year_indexes = [n*i for i=1:T]
    motion = full_simulation(S0, T, n, m, term)
    payoffs = [price_function(motion[i, year_indexes]) for i=1:m]
    return mean(payoffs)
end

mean_payoffs = zeros(num_simulations)
for i=1:num_simulations
    tic()
    mean_payoffs[i] = phoenix_with_memory()
    time = toq()
    @printf("Mean of simulation %i: \$%.4f; Simulation time: %.2fs\n",
        i, mean_payoffs[i], time)
end

final_mean = mean(mean_payoffs)
println("Mean over $num_simulations simulations: $(mean(mean_payoffs))")
pv = final_mean * exp(-(prod(forward_structure)-1)*(T))
@printf("Present value of Phoenix with memory note: \$%.2f", pv)
```

    Mean of simulation 1: $108.8612; Simulation time: 5.89s
    Mean of simulation 2: $109.0226; Simulation time: 5.90s
    Mean of simulation 3: $108.9175; Simulation time: 5.92s
    Mean of simulation 4: $108.9426; Simulation time: 5.94s
    Mean of simulation 5: $108.8087; Simulation time: 6.06s
    Mean over 5 simulations: 108.91052564051816
    Present value of Phoenix with memory note: $100.09
