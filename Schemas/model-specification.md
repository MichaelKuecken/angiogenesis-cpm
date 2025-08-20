# Angiogenesis model specification (work in progress)

The following implementation refers to the model implemented in: 

Merks RMH, Perryn ED, Shirinifard A, Glazier JA (2008) Contact-Inhibited Chemotaxis in De Novo and Sprouting Blood-Vessel Growth. PLOS Computational Biology 4(9): e1000163. doi:  [10.1371/journal.pcbi.1000163](https://doi.org/10.1371/journal.pcbi.1004163).

## Model overview

The model consists of endothelial cells (ECs) implemented in a cellular Potts model (CPM).  ECs locally produce a chemokine, VEGF, which diffuses in space and decays outside of ECs. 
As ECs also chemotax towards higher VEGF concentrations, this introduces a feedback loop: high VEGF recruits more ECs, which locally produce even more VEGF. 

The model therefore consists of two linked fields:
- The CPM field, $G_\text{CPM}$ containing the ECs
- The chemokine field $G_\text{VEGF}$ containing VEGF

Which interact as follows:
- New VEGF is deposited in the chemokine field iff the corresponding position in the CPM is occupied by an EC
- VEGF is degraded in the chemokine field iff the corresponding position in the CPM is not occupied by an EC
- A chemotaxis term favours motility of ECs in the CPM field towards positions with higher VEGF concentration in the chemokine field.

Details are outlined below.

## Cellular Potts Model

### Representation
The CPM is implemented as a lattice $G_\text{CPM}$ of width $w$ and height $h$, consisting of $n_p = w \times h$ pixels $p$ with periodic boundary conditions in all dimensions.
A pixel's identity $\sigma(p)$ reflects by which endothelial cell (EC) the position is currently occupied:

$$\sigma(p) = \begin{cases}
0 & \text{unoccupied}\\
1 & \text{occupied by EC 1}\\
2 & \text{occupied by EC 2}\\
& etc.
\end{cases}$$

We also define the "cell type" $\tau(p)$ as:

$$\tau(p) = \begin{cases}
0 & \sigma(p) = 0\\
1 & \text{otherwise}
\end{cases}$$

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

- the sum runs over all ECs $\sigma$ currently on the grid
- $A(\sigma)$ is the current area of the EC with identity $\sigma$
- the lagrange multiplier $\lambda_\text{area}$ is a parameter controlling the strength of the area conservation term, and
- $A_\text{target}$ is the target area (in pixels) of the ECs

#### Chemotaxis


### Overview of CPM implementation details


| Parameter/choice | Description                                                                 | Value |
|-----------|-----------------------------------------------------------------------------|-------|
| $w \times h$ | Grid dimensions in horizontal and vertical direction (number of pixels) | 200 $\times$ 200 pixels |
| Boundary conditions | | periodic |
| Sampling algorithm | How is $p_s$ sampled?  | edgelist |
| $\cal{N}^\text{MH}$ | Neighborhood definition used for sampling neighboring $p_s, p_t$ in the modified Metropolis-Hastings algorithm | 1st-order (von Neumann) |
| CPM Temperature $T$ | | T = 5 |
| $\cal{N}^\text{S}$ | Neighborhood used to define surface energies | 4th-order |
| Interface energies $J(\tau_i,\tau_j)$ | | $J(0,1) = J(1,0) = 4$, $J(1,1) = 1$ |
| $\lambda_\text{area}$ | strength of area conservation term | $\lambda_\text{area} = 5$ |
| $A_\text{target}$ | target area of an EC (in pixels) | $A_\text{target} = 50$ |

## Chemokine field

## Simulation details

