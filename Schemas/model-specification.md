# Angiogenesis model specification (work in progress)

The following implementation refers to the model implemented in: 

Merks RMH, Perryn ED, Shirinifard A, Glazier JA (2008) Contact-Inhibited Chemotaxis in De Novo and Sprouting Blood-Vessel Growth. PLOS Computational Biology 4(9): e1000163. doi:  [10.1371/journal.pcbi.1000163](https://doi.org/10.1371/journal.pcbi.1004163).

## Model overview

### Components

The model consists of endothelial cells (ECs) implemented in a cellular Potts model (CPM).  ECs locally produce a chemokine, VEGF, which diffuses in space and decays outside of ECs. 
As ECs also chemotax towards higher VEGF concentrations, this introduces a feedback loop: high VEGF recruits more ECs, which locally produce even more VEGF. 

The model therefore consists of two linked fields with a shared coordinate system:
- The CPM field, $G_\text{CPM}$ containing the ECs
- The chemokine field $G_\text{VEGF}$ containing VEGF

### Interactions

The two fields interact as follows:

- New VEGF is deposited at position $p$ in $G_\text{VEGF}$ if and only if the corresponding position $p$ in $G_\text{CPM}$ is occupied by an EC
- VEGF is degraded at position $p$ in $G_\text{VEGF}$ if and only if the corresponding position $p$ in $G_\text{CPM}$ is not occupied by an EC
- A chemotaxis term favours motility of ECs in $G_\text{CPM}$ towards positions with higher VEGF concentration $c(p)$ in $G_\text{VEGF}$.

### Model updates

A simulation step consists of the following sequence:

1. Run one simulation step (MCS) in $G_\text{CPM}$
2. Run $N_d$ PDE steps in $G_\text{VEGF}$ by repeating the following $N_d$ times:
    1. Perform a diffusion step at rate $D/N_d$
    2. Perform chemokine production within ECs at rate $\alpha / N_d$ and chemokine decay outside of ECs at rate $\epsilon / N_d$

For details on each of these, see below.

## Cellular Potts Model

### Representation and notation
The CPM is implemented as a lattice $G_\text{CPM}$ of width $w$ and height $h$, consisting of $n_p = w \times h$ pixels $p$ with periodic boundary conditions in all dimensions.
The identity function $\sigma(p)$ reflects by which endothelial cell (EC) the position is currently occupied:

$$\sigma(p) = \begin{cases}
0 & \text{unoccupied}\\
1 & \text{occupied by EC 1}\\
2 & \text{occupied by EC 2}\\
& etc.
\end{cases}$$

We also define the "cell type" function $\tau(p)$ as:

$$\tau(p) = \begin{cases}
0 & \sigma(p) = 0\\
1 & \text{otherwise}
\end{cases}$$

### Initial condition

Starting with an empty CPM ($\sigma(p) = 0 \quad \forall \quad p \in G_\text{CPM}$), before the start of the simulation, 
400 ECs were seeded in a grid as single pixels as follows:

$$ p_{mn} \leftarrow ( 5 + 10m, 5 + 10n )$$
$$ \sigma(p_{mn}) \leftarrow m + 20n + 1$$

for all $m \in 0, ... , 19$ and $n \in 0, ..., 19$, and with no burnin time before the start of the simulation.

### Update algorithm

#### Naive variant

Every Monte Carlo Step (MCS), $n_p$ copy attempts are performed using the following modified Metropolis-Hastings algorithm. 
Naively speaking, the basic algorithm to perform one MCS works as follows:

- initialize $\Delta t = 0$

- while $\Delta t < n_p$:

  1. $\Delta t$++
  2. Uniformly sample a source pixel $p_s$ on $G_\text{CPM}$
  3. Uniformly sample a target pixel $p_t$ from its neighborhood defined by neighborhood function $\cal{N}^\text{MH}(p_s)$.
  4. Evaluate the difference $\Delta \mathcal{H}$ in the global system energy $\mathcal{H}$ (defined below) that would arise from the proposed update: $\sigma(p_t) \leftarrow \sigma(p_s)$
  5. Accept change $\sigma(p_t) \leftarrow \sigma(p_s)$ with probability :
  
$$P_\text{copy}(p_s \rightarrow p_t) = \begin{cases}
  1 & \Delta \mathcal{H} \leq 0\\
  e^{-\Delta \mathcal{H} / T} & \text{otherwise}
  \end{cases}$$

We'll call this the "naive" algorithm. In practice, this is inefficient since in many cases, $\sigma(p_s) = \sigma(p_t)$ and there is no need to evaluate the corresponding $\Delta \mathcal{H}$. 

#### "edgelist" variant

In practice, we therefore use the so-called "edgelist" algorithm instead:

- initialize $\Delta t = 0$

- while $\Delta t < 1$:

  1. Create a list $\cal{E}$ of pixels $p$ for which at least one neighbor $n_p \in \cal{N}^\text{MH} (p)$ has $\sigma(n_p) \neq \sigma(p)$. Denote the number of pixels in this list $n_E$.
  2. Uniformly sample $p_s$ from $\cal{E}$
  3. $\Delta t \leftarrow \Delta t + \frac{1}{n_E}$ (the expected time this would have taken to find a $p_s \in \cal{E}$ through uniform sampling from the entire grid)
  4. Proceed with steps 3-5 of the naive algorithm.
 
### Hamiltonian

#### Global energy

The global system energy or Hamiltonian $H$ contains components for surface energies and area conservation, and is defined as:

$$\cal{H} = \cal{H}\_\text{surface} + \cal{H}\_\text{area}$$

The surface energy is defined as:

$$\cal{H}\_\text{surface} = \sum_{p_i}\sum_{p_j \in \cal{N}^S(p_i)} (1 - \delta_{ij}) J(\tau_i, \tau_j), \qquad \delta_{ij} = \begin{cases}
  0 & \sigma(p_i) \neq \sigma(p_j) \\
  1 & \sigma(p_i) = \sigma(p_j)
\end{cases}$$

Where:

- The first sum runs over all pixels $p_i$ on the grid
- $\cal{N}^S$ is the neighborhood function used to define surface/contact energies (which may or may not be the same as the neighborhood $\cal{N}^{MH}$ used for sampling)
- $\tau_i,\tau_j$ are shorthand for $\tau(p_i), \tau(p_j)$, and the parameters $J(\tau_i, \tau_j)$ reflect interface energies

The area preservation term is defined as: 

$$\cal{H}\_\text{area} = \lambda\_\text{area} \sum_{\text{cells }\sigma} (A(\sigma) - A_\text{target})^2$$

Where: 

- the sum runs over all ECs $\sigma > 0$ currently on the grid
- $A(\sigma)$ is the current area of the EC with identity $\sigma$
- the lagrange multiplier $\lambda_\text{area}$ is a parameter controlling the strength of the area conservation term
- $A_\text{target}$ is the target area (in pixels) of the ECs

#### Chemotaxis

In addition to the surface energy and area conservation terms, we introduce a "work term" promoting chemotaxis towards higher chemokine concentrations.
We define a general work term for movement along a given direction as the energy difference 
$\Delta H (p_\text{s} \rightarrow p_\text{t})$ associated with a proposed copy attempt from source pixel $p_\text{s}$ into target pixel $p_\text{t}$, 
involving cells $\sigma_\text{s} = \sigma(p_s)$ and $\sigma_\text{t} = \sigma(p_t)$. In other words, this reflects the work acting on the cell(s) due to the displacement induced by 
the update. Generally speaking:

$$\Delta H_\text{work} (p_s \rightarrow p_t) = \delta_s(\tau_s, \tau_t) \Delta H_\text{work} (\sigma_s) + \delta_t(\tau_s, \tau_t) \Delta H_\text{work}(\sigma_t)$$

where $\delta_\text{s}(\tau_s, \tau_t), \delta_\text{t}(\tau_s, \tau_t) \in 0,1$ determine whether the chemotactic force performing the work acts on the "protruding" cell $\sigma_\text{s}$ and/or the "retracting" cell $\sigma_\text{t}$. Unless otherwise specified, we assume:

$$\delta_\text{s}(\tau_s, \tau_t)  = \begin{cases}
  0 & \tau_s = 0, \tau_t = 1 \\
  1 & \tau_s = 1, \tau_t = 0 \\
  0 & \tau_s = 1, \tau_t = 1 \\
\end{cases}$$

$$\delta_\text{t}(\tau_s, \tau_t) = \begin{cases}
  1 & \tau_s = 0, \tau_t = 1 \\
  0 & \tau_s = 1, \tau_t = 0 \\
  0 & \tau_s = 1, \tau_t = 1 \\
\end{cases}$$


More specifically, we define the chemotactic work term as:

$$\Delta H_\text{work} (\sigma) =  \Delta H_\text{chem} (\sigma) = -\mu(\sigma) \left( \frac{c( p_t )}{1 + sc(p_t)} - \frac{c( p_s )}{1 + sc(p_s)} \right)$$

Where:

- $c( p )$ is the current VEGF concentration at the matching position $p$ on $G_\text{VEGF}$
- the chemotactic strength parameter $\mu(\sigma)$ is a constant: $\mu$
- $s$ is the saturation coefficient of sensing the chemokine gradient

### Overview of CPM implementation details

| Parameter/choice | Description                                                                 | Value |
|-----------|-----------------------------------------------------------------------------|-------|
| $w \times h$ | Grid dimensions in horizontal and vertical direction (number of pixels) | 200 $\times$ 200 pixels |
| Boundary conditions | | periodic |
| Initial condition | | $\sigma(p) = 0$ except for 400 ECs seeded as single pixels in a 20 $\times$ 20 grid (described above) |
| Update algorithm | How is $p_s$ sampled?  | edgelist |
| $T$ | CPM temperature controlling acceptance rate of energetically unfavourable updates | T = 5 |
| $\cal{N}^\text{MH}$ | Neighborhood definition used for sampling neighboring $p_s, p_t$ in the modified Metropolis-Hastings algorithm | 1st-order (von Neumann) |
| $\cal{N}^\text{S}$ | Neighborhood used to define surface energies | 4th-order |
| Interface energies $J(\tau_i,\tau_j)$ | | $J(0,1) = J(1,0) = 4$, $J(1,1)$ is varied with default $J(1,1) = 1$ |
| $\lambda_\text{area}$ | strength of area conservation term | $\lambda_\text{area} = 5$ |
| $A_\text{target}$ | target area of an EC (in pixels) | $A_\text{target} = 50$ pixels |
| $\delta_\text{s}(\tau_s, \tau_t)$ | Do we consider the work on cell $\sigma_s$ given a copy attempt from type $\tau_s$ to $\tau_t$? | $\delta_s( 0, 1) = 0$,  $\delta_s( 1, 0) = 1$ $\delta_s( 1, 1) = 0$|
| $\delta_\text{t}(\tau_s, \tau_t)$ | Do we consider the work on cell $\sigma_t$ given a copy attempt from type $\tau_s$ to $\tau_t$? | $\delta_t( 0, 1) = 1$,  $\delta_t( 1, 0) = 0$ $\delta_t( 1, 1) = 0$|
| $\mu(\sigma)$ | Strength of the chemotactic force acting on cell $\sigma$ | Varied, with default $\mu(\sigma) = \mu = 500$ |
| $s$ | Saturation coefficient of sensing the gradient | Varied, with default $s = 0.1$ |


## Chemokine field

### Representations
The chemokine is implemented on a separate (Float32) grid of the same $w \times h$ dimensions as the CPM itself and with periodic boundaries.
$c(p)$ denotes the current chemokine concentration at pixel $p$.

### Initial condition
$c(p) = 0$ everywhere.

### PDE
The chemokine is described by the following PDE:

$$\frac{\partial c(p)}{\partial t} = \alpha(p)  + D\nabla^2 c(p) - \epsilon(p) c(p) $$

where $D$ is the diffusion coefficient (in pixels<sup>2</sup>/MCS), $\epsilon(p)$ the degradation rate at position $p$ per MCS, and $\alpha(p))$ the chemokine production
at position $p$ per MCS:

$$\alpha(p) = \begin{cases}
\alpha & \sigma(p) > 0 \text{ in } G_\text{CPM}\\
0 & \text{otherwise}
\end{cases} $$

$$\epsilon(p) = \begin{cases}
0 & \sigma(p) > 0 \text{ in } G_\text{CPM}\\
\epsilon & \text{otherwise}
\end{cases} $$

### Solver

Although the parameters are expressed in units per MCS, the PDE is implemented using a finite difference scheme (https://en.wikipedia.org/wiki/Discrete_Laplace_operator#Finite_differences) with h = 1, and solved with $N_{ds}=10$ steps after every MCS in the CPM (where $D$, $\alpha$ and $\epsilon$ have to be divided by $N_{ds}$ to maintain the same effective rates per MCS).

### Overview of PDE implementation details

| Parameter/choice | Description                                                                 | Value |
|-----------|-----------------------------------------------------------------------------|-------|
| $w \times h$ | Grid dimensions in horizontal and vertical direction (number of pixels) | 200 $\times$ 200 pixels |
| Boundary conditions | | periodic |
| Data type | | Float32 |
| Solver type | | Finite difference scheme with $h=1$ |
| $N_{ds}$ | Solver timescale : how many diffusion steps are performed for every MCS? | $N_{ds}=10$ |
| $D$ | diffusion coefficient | $D = 1$ pix<sup>2</sup>/MCS, $D = 1/N_{ds}$ pix<sup>2</sup>/diffusion step |
| $\alpha$ | VEGF secretion rate by ECs | $\alpha = 0.3$/MCS, $\alpha = 0.3/N_{ds}$ /diffusion step |
| $\epsilon$ | VEGF decay rate outside of ECs | Varied, with default $\epsilon = 0.3$ /MCS, $\epsilon = 1/N_{ds}$ /diffusion step |

## Simulation details

