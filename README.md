# Rangoli Arrays: The Multiplication Adventure 🪔✨

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/divyaitankar2006-art/Rangoli-Arrays)
[![Deploy to GitHub Pages](https://github.com/divyaitankar2006-art/Rangoli-Arrays/actions/workflows/deploy.yml/badge.svg)](https://github.com/divyaitankar2006-art/Rangoli-Arrays/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Demo-Play%20Online-FF6F00?style=flat&logo=googlechrome&logoColor=white)](https://divyaitankar2006-art.github.io/Rangoli-Arrays/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🔗 **Repository**: [https://github.com/divyaitankar2006-art/Rangoli-Arrays](https://github.com/divyaitankar2006-art/Rangoli-Arrays)  
> 🎮 **Live Game**: [https://divyaitankar2006-art.github.io/Rangoli-Arrays/](https://divyaitankar2006-art.github.io/Rangoli-Arrays/)

An interactive, visual educational math game designed for young learners (Grades 3–4) to discover and master multiplication arrays through the beauty of traditional Indian rangoli dot patterns.

---

## 🌟 Key Features

- **Art Meets Mathematics**: Teaches array representation of multiplication (rows × columns) and the commutative property using vibrant rangoli dots and patterns.
- **Multiple Game Modes**:
  - **Beginner**: Foundational grid counting and row/column arrays (up to 5×5).
  - **Intermediate**: Missing factor challenges (`4 × ? = 20`) and target products.
  - **Advanced**: Complex multi-factor boss challenges and arrays up to 10×10.
  - **Speed Challenge**: Rapid-fire 60-second multiplication round with streak and accuracy tracking.
  - **Free Rangoli Creator**: Sandbox mode allowing kids to customize grid dimensions, select vibrant festival colors, and design custom symmetrical rangolis.
- **Audio & Sensory Feedback**:
  - Synthetic Web Audio API clicks, positive reinforcement bells, and fanfare.
  - Background instrumental music loop with mute toggles.
  - Voice praise via Web Speech API.
- **Responsive & Accessible**: Seamlessly playable across desktops, tablets, and mobile screens.
- **Local Progress Persistence**: Stores star counts and unlocked levels across sessions using `localStorage`.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` (bundled with Node.js)

### Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/divyaitankar2006-art/Rangoli-Arrays.git
   cd Rangoli-Arrays
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to the local URL shown in your terminal (usually `http://localhost:5173`).

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

To preview the built app locally:

```bash
npm run preview
```

---

## 🌐 Deploying to GitHub Pages

This repository includes an automated GitHub Actions deployment workflow in `.github/workflows/deploy.yml`.

### Steps to enable GitHub Pages:

1. Push your repository to GitHub on the `main` branch.
2. In your GitHub repository, go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The workflow will automatically build the project and publish your game to `https://divyaitankar2006-art.github.io/Rangoli-Arrays/`.

---

## 📂 Project Structure

```plaintext
Rangoli-Arrays/
├── .github/
│   └── workflows/
│       └── deploy.yml      # Automated GitHub Pages CI/CD workflow
├── public/
│   ├── bgm.wav             # Background music audio asset
│   └── favicon.svg         # Festive Diya browser favicon
├── .gitignore              # Files and folders ignored by Git
├── game.js                 # Core game logic, state management, and audio
├── generate_bgm.py         # Python audio synthesis generator script
├── index.html              # HTML structure and game screens
├── package.json            # Project metadata and build scripts
├── package-lock.json       # Exact lockfile for deterministic CI/CD builds
├── style.css               # Styling, animations, colors, and responsive layouts
├── vite.config.js          # Vite configuration with relative base paths
└── README.md               # Project documentation
```

---

## 💡 Pedagogical Approach

In early mathematics education, rote memorization of multiplication tables often disconnects children from spatial and conceptual understanding. **Rangoli Arrays** bridges this gap:
- **Array Model**: Understanding multiplication as equal rows and columns.
- **Commutative Property**: Visually observing that a $3 \times 4$ array contains the same number of dots as a $4 \times 3$ array when viewed from different orientations.
- **Cultural Resonance**: Drawing inspiration from Indian cultural practices where geometric dot grids (*kolam* / *rangoli*) form complex art forms.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
