---
title: "A KaTeX Rendering Tour"
date: "2026-08-16"
draft: true
metaDesc: "An evaluation post: the LaTeX features this site renders via KaTeX."
tags:
  - test
---

This is an evaluation post. Its only job is to show how the math
rules in `src/utils/markdown.js` render to the page, so the KaTeX
integration can be reviewed. Delete it when you are done.

Delimiters: inline math is `$...$`, display math is `$$...$$`
(single-line or multi-line). Two conventions: no space directly
inside the delimiters, and a `$` that immediately follows a word
character is never treated as an opener. Red text means KaTeX
refused to render the formula (see the last sections).

## Inline math

Euler's identity $e^{i\pi}+1=0$ is often called the most beautiful
equation in mathematics. A single sentence can carry several
formulas: the area of a circle is $A=\pi r^2$, the slope of
$y=mx+b$ is $m$, and the discriminant $\Delta=b^2-4ac$ decides
whether the roots of $ax^2+bx+c=0$ are real.

Sub- and superscripts chain: $x_i^{(2)}$ is the second iterate of
the $i$-th component, while $f^{-1}(g^{-1}(x))$ composes inverse
functions, and primes work as $f' = f'' = f'''$.

Inline big operators tuck their limits in:
$\sum_{i=1}^{n} i = \tfrac{n(n+1)}{2}$ and
$\lim_{x\to 0} \frac{\sin x}{x} = 1$.
Force limits above and below with
$\sum\limits_{i=1}^{n}$ and $\prod\limits_{k=0}^{\infty}$.

Prices stay literal — a 5$ resistor and a 10$ capacitor, or a $5
part and a $10 board: no math mode is entered, because the
delimiters here never satisfy the opener rules.

## Display blocks

The quadratic formula, single-line block:

$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$

Multi-line blocks continue until a line ending in `$$` — Maxwell's
equations in differential form:

$$\begin{aligned}
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \epsilon_0 \frac{\partial \mathbf{E}}{\partial t} \\
\nabla \cdot \mathbf{E} &= \frac{\rho}{\epsilon_0} \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \cdot \mathbf{B} &= 0
\end{aligned}$$

`align` lines up at the `&` positions — the Lorenz system:

$$\begin{align}
x' &= \sigma (y - x) \\
y' &= x (\rho - z) - y \\
z' &= xy - \beta z
\end{align}$$

And `align*`:

$$\begin{align*}
a^2 + b^2 &= c^2 \\
\tan\theta &= \frac{b}{a}
\end{align*}$$

`equation` wraps a single formula (it does not get an automatic
number in this build — see "Numbering and tags"):

$$\begin{equation}
e^{i\pi} + 1 = 0
\end{equation}$$

`gathered` centers every line:

$$\begin{gathered}
(x+y+z)^2 = x^2 + y^2 + z^2 \\
+ 2xy + 2xz + 2yz
\end{gathered}$$

## Matrices

$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
= \begin{pmatrix} ax + by \\ cx + dy \end{pmatrix}$$

Round, square, and vertical bars; `cases` for piecewise functions:

$$\mathbf{u} = \begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}, \qquad
\begin{Bmatrix} a & b \\ c & d \end{Bmatrix}, \qquad
P(t) = \begin{cases}
0, & t < 0 \\
t, & 0 \le t \le 1 \\
2 - t, & 1 < t \le 2 \\
0, & t > 2
\end{cases}$$

Inline matrices stay at text scale:
$\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc$,
$\begin{smallmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{smallmatrix}$,
and the Euclidean norm is
$\lVert \mathbf{x} \rVert_2 = \sqrt{x_1^2 + \cdots + x_n^2}$.

## Big operators and limits

Display mode puts limits above and below:

$$\sum_{i=1}^{n} \prod_{j=1}^{m} x_{ij} \qquad
\int_{0}^{\infty} e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2} \qquad
\iint_{D} f(x,y)\,dx\,dy \qquad
\oint_{\gamma} f(z)\,dz \qquad
\bigcup_{i=1}^{n} A_i$$

Limits that read as limits:

$$\lim_{x\to 0} \frac{e^x - 1}{x} = 1, \qquad
\limsup_{n\to\infty} a_n \le \liminf_{n\to\infty} b_n, \qquad
\lim_{n\to\infty} \left(1 + \frac{1}{n}\right)^n = e$$

## Fractions, radicals, continued fractions

Nested fractions and indexed roots:

$$\frac{1}{1 + \frac{2}{3 + \frac{4}{5}}} \qquad
\sqrt{2} + \sqrt[3]{2} + \sqrt[n]{\frac{a}{b}} \qquad
\frac{\partial f}{\partial x} \bigg|_{x=0}$$

A continued fraction, the kind of thing that would be painful to lay
out by hand:

$$\cfrac{1}{2 + \cfrac{1}{3 + \cfrac{1}{4 + \cfrac{1}{5}}}}$$

## Accents, bars, and brackets

$$\hat{\theta} \qquad \vec{v} \qquad \bar{x} \qquad \tilde{f} \qquad
\widehat{xyz} \qquad \widetilde{xyz} \qquad \dot{x} \qquad \ddot{x}$$

$$\overline{AB} \qquad \underline{\sum} \qquad
\overbrace{a + b + c}^{\text{the sum of the terms}} \qquad
\underbrace{x \cdot x \cdot x}_{\text{the cube}} \qquad
a \stackrel{\text{def}}{=} b \qquad
\underset{\gamma}{\lim} \qquad
\overset{+}{-}$$

## Fonts and text

$$\mathbf{x} \qquad \bm{A} \qquad \pmb{x} \qquad \mathit{x} \qquad
\mathrm{d}x \qquad \mathcal{L} \qquad \mathbb{R} \qquad \mathfrak{g} \qquad
\mathsf{x} \qquad \mathtt{x}$$

Text inside math: $\text{for } x \in \text{dom}(f)$,
$\textbf{bold text}$, $\textit{italic text}$, and
$\operatorname{erf}(x)$ for a roman operator.

## Delimiters, sizing, and spacing

Auto-sizing delimiters scale to their content; `\big` through
`\Bigg` do it manually; `\left.` and `\right|` size invisible
anchors:

$$\left( \frac{a}{b} \right) \qquad
\left[ \begin{array}{cc} a & b \\ c & d \end{array} \right] \qquad
\left\{ \frac{a}{b} \right\} \qquad
\left. \frac{d}{dx} \right|_{x=0} \qquad
\bigg( \frac{a}{b} \bigg) \quad
\Bigg( \frac{a}{b} \Bigg)$$

Custom fraction delimiters with `\genfrac`, and the binomial
coefficient:

$$\genfrac{[}{]}{0pt}{}{a}{b} \qquad
\binom{n}{k} = \frac{n!}{k!(n-k)!} \qquad
{n \choose k}$$

Spacing: thin `$a\,b$`, thick `$a\;b$`, negative `$a\!b$`,
word `$a\quad b$`, and double-word `$a\qquad b$`.

## Symbols

Relations: $a \le b$, $a \ge b$, $a \ne b$, $a \approx b$,
$a \equiv b$, $a \sim b$, $a \simeq b$, $a \cong b$,
$a \propto b$, $a \ll b$, $a \gg b$, $a \leqslant b$.

Operators: $a + b$, $a \pm b$, $a \mp b$, $a \times b$,
$a \cdot b$, $a \circ b$, $a \bullet b$, $a \div b$,
$a \bmod b$, $a \pmod{b}$, $a \mid b$, $a \nmid b$.

Arrows: $a \to b$, $a \mapsto b$, $a \rightarrow b$,
$a \Rightarrow b$, $a \Leftarrow b$, $a \iff b$,
$a \xrightarrow{\text{label}} b$, $a \hookrightarrow b$,
$a \twoheadrightarrow b$.

Sets and logic: $a \in S$, $a \notin S$, $S \subset T$,
$S \subseteq T$, $A \cup B$, $A \cap B$, $A \setminus B$,
$\emptyset$, $\forall x$, $\exists y$, $\nexists z$,
$\therefore$, $\because$.

Greek and geometry:
$\alpha\,\beta\,\gamma\,\delta\,\varepsilon\,\zeta\,\eta\,\theta\,\vartheta\,\iota\,\kappa\,\lambda\,\mu\,\nu\,\xi\,\pi\,\rho\,\sigma\,\tau\,\upsilon\,\phi\,\varphi\,\chi\,\psi\,\omega$
and capitals
$\Gamma\,\Delta\,\Theta\,\Lambda\,\Xi\,\Pi\,\Sigma\,\Phi\,\Psi\,\Omega$,
plus $\angle ABC$, $\triangle ABC$, $a \perp b$, $a \parallel b$,
$\hbar$, $\ell$, $\Re z$, $\Im z$, $\aleph_0$.

## Color, boxes, and cancellation

$$\textcolor{red}{\mathbf{x}} \qquad
\textcolor{blue}{f(x)} \qquad
\textcolor{#e67e22}{\frac{a}{b}} \qquad
\colorbox{yellow}{\text{a colored box}} \qquad
\boxed{\frac{-b \pm \sqrt{b^2-4ac}}{2a}}$$

Cancellation, in three flavors:
$a \cancel{+} b$, $x \bcancel{-} y$, $z \xcancel{*} w$.

## Numbering and tags

This KaTeX build does not number `equation` or `align` lines
automatically, and `\label`/`\eqref` are unsupported. Explicit
numbering works with `\tag`:

$$e = \sum_{n=0}^{\infty} \frac{1}{n!} \tag{2.71828}$$

## Local macros

`\newcommand` works, but only inside the formula that defines it
— macros do not leak across formulas:

$$\newcommand{\E}{\mathbb{E}} \qquad \newcommand{\Var}{\operatorname{Var}} \qquad
\E[X] = \mu \qquad \Var(X) = \E[(X - \mu)^2]$$

## Error handling

KaTeX is called with `throwOnError: false`, so invalid math renders
as readable red text at the failure point instead of breaking the
build.

Unknown command:

$$\unknowncommand{x}$$

Unbalanced fraction:

$\frac{1}$

The `\href` command requires the `trust` option, which this site
does not enable:

$$\href{https://example.org}{a link}$$

## Known limitations

- Math does not wrap. This inline formula overflows the column
  instead of breaking:
  $\det\begin{pmatrix} a_{11} & a_{12} & a_{13} & a_{14} & a_{15} \\ a_{21} & a_{22} & a_{23} & a_{24} & a_{25} \\ a_{31} & a_{32} & a_{33} & a_{34} & a_{35} \\ a_{41} & a_{42} & a_{43} & a_{44} & a_{45} \\ a_{51} & a_{52} & a_{53} & a_{54} & a_{55} \end{pmatrix} = \sum_{\sigma \in S_5} \operatorname{sgn}(\sigma) \prod_{i=1}^{5} a_{i,\sigma(i)}$
- No automatic equation numbering: `equation` and `align` render
  without numbers, and `\label`/`\eqref` are unsupported — use
  `\tag` for explicit numbers.
- `\eqnarray`, `\multline`, `\widebar`, `\cancelto`, `\html`,
  `\href`, `\includegraphics`, and `\resizebox` are unsupported in
  this KaTeX build (or disabled by default).
- Inline math is one line only; a `$` pair spanning a newline is
  literal text.
