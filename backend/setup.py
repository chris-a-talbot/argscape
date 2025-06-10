from setuptools import setup, find_packages

setup(
    name="argscape-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "numpy",
        "tskit",
        "msprime",
        "scikit-learn",
        "pandas",
        "python-multipart",
    ],
    python_requires=">=3.8",
) 