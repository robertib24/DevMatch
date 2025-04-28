# CV-Job Matcher

A modern web application that uses AI to match CVs with job descriptions, helping recruiters find the best candidates for positions.

![CV-Job Matcher Dashboard](https://i.imgur.com/UVbKq9s.png)

## Features

- **AI-Powered Matching**: Uses Google's Gemini AI to analyze and score the match between CVs and job descriptions
- **Multiple Match Criteria**: Scores based on industry match (10%), technical skills (30%), and overall description match (60%)
- **CV Management**: Upload, view, and manage candidate CVs in .docx format
- **Job Management**: Upload, view, and manage job descriptions in .docx format
- **Match Results**: View and analyze detailed matching results between candidates and positions
- **Responsive Design**: Modern UI that works well on desktop and mobile devices

## Technology Stack

### Backend
- Django 5.2 with Django REST Framework
- PostgreSQL database
- Google Gemini AI API for CV-job matching analysis
- Python docx for document processing

### Frontend
- Angular 17 (standalone components)
- SCSS for styling
- Responsive design with CSS Grid and Flexbox

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Google Gemini API key

### Backend Setup

# Clone the repository:
```bash
git clone https://github.com/your-username/cv-job-matcher.git
cd cv-job-matcher
```

# Create virtual environment:
```bash
python -m venv venv
```

# Activate the virtual environment:
```bash
venv\Scripts\activate # On Windows
source venv/bin/activate # On macOS/Linux
```

# Install dependencies:
```bash
pip install -r requirements.txt
```

# Create .env file in project root with the following variables:
```
SECRET_KEY=your_django_secret_key
GEMINI_API_KEY=your_gemini_api_key
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
```

# Set up the database and run the development server:
```bash
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

# Navigate to the frontend directory and install dependencies:
```bash
cd cv-matcher-frontend
npm install
```

# Start the development server:
```bash
ng serve
```

# Access the application at:
```
http://localhost:4200
```

### Project Structure
```
cv-job-matcher/
│
├── api/                 # Django API app
│   ├── migrations/      # Database migrations
│   ├── models.py        # Data models
│   ├── serializers.py   # DRF serializers
│   ├── urls.py          # API URL routing
│   ├── views.py         # API views
│   └── utils.py         # Utility functions
│
├── cv_matcher/          # Django project settings
│   ├── settings.py      # Project settings
│   ├── urls.py          # Project URL routing
│   └── wsgi.py          # WSGI config
│
├── cv-matcher-frontend/ # Angular frontend
│   ├── src/             # Source code
│   │   ├── app/         # Angular components
│   │   ├── styles/      # Global styles
│   │   └── ...
│   └── ...
│
├── media/               # Uploaded files directory
│   └── cvs/             # Uploaded CVs
│
├── requirements.txt     # Python dependencies
└── README.md            # Project documentation
```

# Potential Improvements
- Add user authentication
- Add more sophisticated matching algorithms
- Support for more document formats (PDF, TXT)
- Implement unit and integration tests

# Acknowledgments
- Google Gemini AI for the matching algorithm
- Django and Angular communities for excellent documentation











