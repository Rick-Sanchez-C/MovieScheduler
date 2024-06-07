# RolScheduler2

## Introduction
RolScheduler2 is a project aimed at providing a scheduling solution for role-based access control. It is designed to streamline and automate the process of assigning roles and permissions within an organization.

## Features
- Automated scheduling of roles
- Integration with existing user management systems
- Configurable via JSON
- Lightweight Docker support

## Installation

1. Clone the repository:
   `git clone https://github.com/Rick-Sanchez-C/RolScheduler2.git`

2. Navigate to the project directory:
   `cd RolScheduler2`

3. Install dependencies:
   `npm install`

## Configuration
Edit the `config.json` file to set up your specific configurations. Example:
```json
{
"default_times": ["17:00", "18:00", "19:00"],
"default_days": ["Saturday", "Sunday"],
"time_zone": "America/New_York"
}
```

### Environment Variables
Create a `.env` file in the root directory and add the following environment variables:
```
DISCORD_TOKEN=your_discord_token
```

## Usage
Run the application with Docker:
```bash
docker build -t rolscheduler2 .
docker run -d -p 8080:8080 rolscheduler2
```

Or without Docker:
```bash
npm start
```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue to discuss what you would like to change.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
For any questions, please contact Rick-Sanchez-C at [repository link](https://github.com/Rick-Sanchez-C/RolScheduler2).


