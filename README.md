🧠 MindBloom – Mental Health Tracker

A database-driven web application designed to help users track, analyze, and improve their mental well-being through structured data collection and insights.


🌟 Overview

MindBloom is a Mental Health Support Application developed as part of a Database Systems Lab project. The system enables users to monitor their emotional and behavioral patterns by tracking:
	•	Mood entries
	•	Daily activities
	•	Sleep patterns
	•	Gratitude journaling

The application uses a relational database design to ensure structured, consistent, and scalable data storage.


🎯 Objectives
	•	Design a structured system for mental health tracking
	•	Implement a normalized relational database (up to 3NF)
	•	Ensure data integrity using primary and foreign keys
	•	Provide meaningful insights into user behavior
	•	Build a user-friendly and interactive platform


🏗️ System Architecture

The application follows a 3-tier architecture:

1. Presentation Layer
	•	Built using HTML, CSS, JavaScript
	•	Handles user interaction and UI

2. Application Layer
	•	Backend logic using Node.js and Express.js
	•	Handles validation, processing, and API communication

3. Data Layer
	•	MySQL relational database
	•	Stores structured user data


🧩 Database Design

📌 Core Tables
	•	User(user_id, name, email, password, age)
	•	MoodEntry(mood_id, user_id, mood, date, notes)
	•	Activity(activity_id, user_id, activity_name, duration, date)
	•	GratitudeEntry(gratitude_id, user_id, content, date)
	•	SleepLog(sleep_id, user_id, hours_slept, sleep_quality, date)
	•	Badge(badge_id, badge_name, description)
	•	UserBadge(user_id, badge_id, earned_date)
	•	PeerPost(post_id, user_id, content, created_at)

📌 All dependent tables reference user_id as a foreign key for maintaining relationships.


🔗 ER Model

The ER Diagram (see report page 14) shows relationships such as:
	•	One user → many mood entries, activities, sleep logs
	•	Many-to-many relationship between users and badges
	•	Users creating peer posts


⚙️ Features
	•	📊 Mood tracking and analysis
	•	🏃 Activity monitoring
	•	😴 Sleep tracking
	•	🙏 Gratitude journaling
	•	🏆 Gamification via badges
	•	💬 Peer interaction (posts)


🧠 Database Concepts Used
	•	Relational Schema Design
	•	Primary & Foreign Keys
	•	Normalization (up to 3NF)
	•	SQL Queries (CRUD operations)
	•	Views:
	•	UserWellnessSummary
	•	WeeklyAnalytics
	•	Leaderboard
	•	Triggers:
	•	after_points_update


🛠️ Tech Stack
	•	Frontend: HTML5, CSS3, JavaScript
	•	Backend: Node.js, Express.js
	•	Database: MySQL
	•	Deployment: Railway


🔄 Data Flow
	1.	User inputs data via frontend
	2.	Backend validates and processes input
	3.	Data stored in relational database
	4.	Queries retrieve insights
	5.	Results displayed to user
