# 💼 Virtual CV Portfolio

A modern and responsive virtual CV and software portfolio built with **Next.js**, **React**, **TypeScript**, and **Tailwind CSS v4**.

The project provides a professional online space where I can present my personal profile, academic background, technical skills, qualifications, and software-development projects to recruiters, employers, and other visitors.

🔗 **Live Demo:** Add your deployed Vercel link here

---

## 🎯 Project Purpose

The main purpose of this project is to present my software-development projects and professional information through an interactive online portfolio.

Instead of relying only on a traditional PDF CV, the website allows visitors to explore my profile, skills, education, and projects through a modern and responsive user interface.

---

## 🚀 Main Features

* 👤 Personal profile and professional introduction
* 🧾 Virtual CV information
* 🎓 Education and qualification sections
* 💻 Software-development project showcase
* 🛠️ Technical skills section
* 📱 Responsive design for mobile, tablet, and desktop
* 🌙 Light and dark theme support
* 🎨 Custom theme variables using Tailwind CSS v4
* 🧩 Reusable interface components
* ♿ Accessible components built with Radix UI
* 🔽 Custom select and dropdown components
* ➖ Reusable horizontal and vertical separator components
* ✨ Lucide React icons
* 🌐 Ready for deployment through Vercel

---

## 🛠️ Technology Stack

| Layer           | Technology      |
| --------------- | --------------- |
| Framework       | Next.js         |
| User Interface  | React           |
| Language        | TypeScript      |
| Styling         | Tailwind CSS v4 |
| UI Components   | Radix UI        |
| Icons           | Lucide React    |
| Hosting         | Vercel          |
| Version Control | Git and GitHub  |

---

## 📁 Project Structure

```text
virtual-cv-portfolio/
├── app/
│   ├── globals.css              # Global styles, colours and theme variables
│   ├── layout.tsx               # Main application layout and metadata
│   └── page.tsx                 # Main portfolio and CV page
│
├── components/
│   ├── ui/
│   │   ├── select.tsx           # Reusable Radix UI select component
│   │   └── separator.tsx        # Reusable separator component
│   └── ...                      # Portfolio section components
│
├── lib/
│   └── utils.ts                 # Shared utility functions
│
├── public/                      # Images, CV documents and static assets
│
├── .vscode/
│   └── settings.json            # VS Code Tailwind CSS configuration
│
├── package.json                 # Project scripts and dependencies
├── tsconfig.json                # TypeScript configuration
├── next.config.ts               # Next.js configuration
└── README.md                    # Project documentation
```

---

## 🎨 Styling and Theme System

The project uses **Tailwind CSS v4** for styling.

Global colours and design variables are stored in:

```text
app/globals.css
```

The stylesheet defines reusable variables for:

* Background colours
* Foreground and text colours
* Cards
* Popovers
* Primary and secondary colours
* Muted content
* Accent colours
* Destructive actions
* Borders and input fields
* Focus rings
* Charts
* Sidebar elements
* Border-radius sizes

The project includes separate colour values for light and dark modes.

Dark mode is controlled using the `.dark` class:

```css
@custom-variant dark (&:is(.dark *));
```

Tailwind theme variables are connected using:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-border: var(--border);
  --color-ring: var(--ring);
}
```

---

## 🧩 Reusable UI Components

### Select Component

The project includes a reusable select component built with **Radix UI Select**.

It supports:

* Select triggers
* Dropdown content
* Selectable items
* Labels
* Separators
* Scroll-up and scroll-down controls
* Disabled states
* Keyboard accessibility
* Responsive dropdown sizing
* Opening and closing animations

The component is located at:

```text
components/ui/select.tsx
```

### Separator Component

The separator component supports both horizontal and vertical orientations.

It is located at:

```text
components/ui/separator.tsx
```

Example usage:

```tsx
<Separator />
```

Vertical separator:

```tsx
<Separator orientation="vertical" />
```

---

## 📦 Getting Started

### ✅ Prerequisites

Before running the project, install:

* Node.js 18 or later
* npm
* Git

Check your installed versions:

```bash
node --version
npm --version
git --version
```

---

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/MDyobiso/virtual-cv.git
```

### 2. Open the project folder

```bash
cd virtual-cv
```

### 3. Install the dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the project in your browser:

```text
http://localhost:3000
```

---

## 📜 Available Scripts

### Run in development mode

```bash
npm run dev
```

Starts the local development server.

### Create a production build

```bash
npm run build
```

Creates an optimised production version of the website.

### Run the production build

```bash
npm run start
```

Starts the compiled production application.

### Check code quality

```bash
npm run lint
```

Checks the project for linting and code-quality problems.

---

## ✍️ Portfolio Customisation

The portfolio can be customised with personal and professional information.

### Personal Information

Update details such as:

* Name
* Professional title
* Personal summary
* Career interests
* Contact information
* GitHub profile
* LinkedIn profile

### CV Information

Add or update:

* Academic qualifications
* Education history
* Technical skills
* Work experience
* Certifications
* Achievements
* Career objectives

### Software Projects

Each project section can include:

* Project name
* Project description
* Technologies used
* Main features
* GitHub repository
* Live demonstration
* Project screenshots
* Challenges solved
* Skills gained

---

## 🖼️ Adding Images

Store profile pictures, project screenshots, icons, and other static files inside:

```text
public/
```

Example:

```text
public/profile-picture.jpg
```

Use the image in the application:

```tsx
<img
  src="/profile-picture.jpg"
  alt="Profile"
  className="h-32 w-32 rounded-full object-cover"
/>
```

For improved Next.js image optimisation, use the `Image` component:

```tsx
import Image from "next/image"

<Image
  src="/profile-picture.jpg"
  alt="Profile"
  width={128}
  height={128}
/>
```

---

## 📄 Adding a Downloadable CV

Place the CV file inside the `public` folder:

```text
public/Muhle-Mabunda-CV.pdf
```

Create a download link:

```tsx
<a href="/Muhle-Mabunda-CV.pdf" download>
  Download CV
</a>
```

---

## 🌐 Deployment with Vercel

The project can be deployed using Vercel.

### Deploy through GitHub

1. Push the project to GitHub.
2. Sign in to Vercel.
3. Select **Add New Project**.
4. Import the Virtual CV Portfolio repository.
5. Confirm that Vercel detects Next.js.
6. Select **Deploy**.

After deployment, Vercel will provide a public link for the portfolio.

Future changes pushed to the GitHub repository can automatically trigger a new deployment.

### Deploy using the Vercel CLI

Install the Vercel command-line tool:

```bash
npm install -g vercel
```

Deploy the project:

```bash
vercel
```

---

## 🔮 Future Improvements

* Add a fully working contact form
* Add downloadable project documents
* Add live project demonstration links
* Add project screenshots and galleries
* Add page transitions and animations
* Add certificates and achievements
* Add an experience timeline
* Improve search-engine optimisation
* Add social-media preview metadata
* Add visitor analytics
* Add a blog or technical writing section
* Add automatic email delivery from the contact form

---

## 👤 Author

**Mbali Dyobiso**

📍 South Africa

🔗 **GitHub:** https://github.com/MDyobiso
---

## 🙌 Acknowledgements

This project was created using:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Radix UI
* Lucide React
* GitHub
* Vercel

---

## 📄 Licence

This project was created for personal portfolio, educational, and professional presentation purposes.

You may use the project structure as inspiration for your own portfolio. Personal information, documents, branding, and images should be replaced with your own content.

---

⭐ If you find this project useful, consider giving the repository a star.
