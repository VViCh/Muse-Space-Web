# Muse Space Web

The client-facing application for the Muse Space platform. This is a robust, server-side rendered Single Page Application (SPA) designed to deliver a premium, responsive, and highly accessible experience for artists and their clients. It acts as the primary gateway for all user interactions, from social discovery to commission processing.

---

## Tech Stack & Tooling

- **Framework**: Next.js 14 (App Router)
- **Library**: React 18
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & Vanilla CSS (with native Dark Mode support)
- **Data Fetching & Mutations**: Axios with custom interceptors for JWT token injection.
- **State Management**: React Context API (`AuthContext`, `ArtworkContext`)
- **Icons**: Material Symbols Outlined
- **Animations**: CSS Keyframes & Tailwind utility transitions.
- **UI Components**: Custom-built masonry grids, draggable carousels, and highly interactive modal overlays.

---

## Folder Structure & Architecture

The repository follows a clean, component-driven architecture designed for high scalability and separation of concerns:

- **`src/app/`**: Contains the Next.js App Router definitions. Each folder represents a distinct route (e.g., `/profile`, `/settings`, `/groups`). Global layouts, root CSS, and metadata are defined here.
- **`src/components/`**: Reusable, pure UI components decoupled from specific pages for high reusability.
  - `MasonryGrid.tsx`: Dynamic column-based layout for seamless artwork rendering.
  - `TagCarousel.tsx`: Draggable horizontal filter list.
  - `ArtworkDetailModal.tsx`: The core discovery modal with infinite scrolling.
  - `Navbar.tsx`: Responsive top navigation with authenticated states.
- **`src/context/`**: Global state management providers.
  - `AuthContext`: Manages login state, JWT persistence, and user profile data.
  - `ArtworkContext`: Global cache for artworks, handling optimistic UI updates for likes and saves.
- **`src/lib/`**: Core utilities.
  - `api.ts`: Axios instance configuration and response error handling.
- **`src/types/`**: TypeScript interfaces defining exact shapes of API responses.

---

## UI Mockups & Flows

*(Replace the placeholders below with actual screenshots of the application)*

### Landing Page & Discovery Feed
Features a masonry grid of trending artworks and a draggable tag carousel for seamless filtering.
<p align="center">
  <a href="https://ibb.co.com/Cp6ZvfHv">
    <img src="https://i.ibb.co/8nbp2H72/image.png" alt="Landing Page Image" border="0" width="700">
  </a>
</p>

### Authentication
Secure login and registration flows with real-time validation.
<p align="center">
  <a href="https://ibb.co.com/r246k5NL">
    <img src="https://i.ibb.co/qYksBmV4/image.png" alt="Landing Page Image" border="0" width="700">
  </a>
</p>

### Artwork Detail & Infinite Scroll
Clicking an artwork opens a rich modal with comments, creator details, and an infinite-scrolling masonry grid of similar artworks.
<p align="center">
  <a href="https://ibb.co.com/xSSrQmNb">
    <img src="https://i.ibb.co/TBBN5KsG/image.png" alt="Landing Page Image" border="0" width="700">
  </a>
</p>

### User Profile & Portfolio
A centralized hub for artists to display their artworks, follower count, and commission availability toggle.
<p align="center">
  <a href="https://ibb.co.com/VcfmHZJd">
    <img src="https://i.ibb.co/LXV5QWYM/image.png" alt="Landing Page Image" border="0" width="700">
  </a>
</p>

### Commission Requests Dashboard
A specialized interface for artists to track incoming requests, update statuses (Pending, Accepted, Completed), and communicate with clients.
<p align="center">
  <a href="https://ibb.co.com/bRFGxN9F">
    <img src="https://i.ibb.co/HpC90G8C/image.png" alt="Landing Page Image" border="0" width="700">
  </a>
</p>

---

## Getting Started

### Prerequisites
1. **Node.js** (v18.17.0 or higher) installed on your machine.
2. The **Muse Space API** running locally or deployed to a remote server.

### Installation & Setup

1. **Clone the repository** (if you haven't cloned the parent repo already):
   ```bash
   git clone https://github.com/Muse-Space-App/Muse-Space-Web.git
   cd Muse-Space-Web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory. You must define the base URL where your backend API is running. If running locally with default .NET settings:

   ```env
   NEXT_PUBLIC_API_URL=https://localhost:7198/api
   ```
   *(Ensure the port matches the one defined in your backend's `launchSettings.json`)*

4. **Run the Development Server**:
   Start the Next.js development server with hot-module replacement enabled:
   ```bash
   npm run dev
   ```

5. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`. You should now see the Muse Space application communicating seamlessly with your configured backend.
