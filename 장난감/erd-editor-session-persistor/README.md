# ERD Editor Session Persistor

A management tool that provides persistent hosting for ERD Editor sessions.

## Introduction

While [ERD Editor](https://erd-editor.io) is an excellent ERD design tool, it requires a host to maintain active sessions for collaboration, which can be inconvenient for continuous access.

This project hosts ERD Editor sessions on a dedicated server, providing 24/7 access and automating the collaboration setup process:
- Automated session hosting and management
- Easy schema creation and sharing
- Continuous access without host restrictions
- Real-time session status monitoring

The hosted server maintains sessions continuously, allowing you to access your ERD designs from anywhere at any time without manual session management.

## Current Status

The current implementation uses Puppeteer for browser automation, which is a temporary solution. Future updates will implement a more robust and efficient approach for session management.

<img width="700" alt="Image" src="https://github.com/user-attachments/assets/fca258a0-99f4-4c50-a45a-b5561fcb4311" />