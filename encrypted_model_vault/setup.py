from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="stressgpt7-encrypted-vault",
    version="1.0.0",
    author="StressGPT7 Team",
    description="Secure encrypted AI model vault system",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/stressgpt7/encrypted-model-vault",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Security :: Cryptography",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "stressgpt7-vault=stressgpt7_vault.cli:main",
        ],
    },
    include_package_data=True,
    package_data={
        "stressgpt7_vault": ["ui/resources/*.png", "ui/resources/*.ico"],
    },
)
