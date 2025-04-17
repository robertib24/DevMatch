# Backend Setup:
# Create virtual environment
```bash
python -m venv venv
```

```bash
venv\Scripts\activate # Activate the venv
```

# Install dependencies:
Install all required packages from requirements.txt:
```bash
pip install -r requirements.txt
```
Set up the database:
```bash
python manage.py migrate
```
Run the development server:
```bash
python manage.py runserver
```
