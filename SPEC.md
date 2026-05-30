# ChiGo - Product Specification (Web MVP)

Version: 1.0

---

# 1. Project Overview

## Vision

ChiGo is an AI-powered dining companion that helps users discover food, understand menus, manage nutrition, and easily connect with dining partners.

The long-term goal is to create a smarter, healthier, and more social dining experience.

---

## Mission

Reduce friction throughout the entire dining journey:

- Discovering restaurants
- Understanding menus
- Choosing meals
- Managing nutrition
- Finding dining companions
- Scheduling meals
- Sharing food experiences

---

## Primary Target Users

### Phase 1 (Initial Launch)

Carnegie Mellon University students in Pittsburgh.

Reasons:

- High concentration of international students
- Strong food culture
- Existing social dining pain points
- Easier community validation

---

### Phase 2

University students across Pittsburgh.

---

### Phase 3

General consumers and travelers.

---

# 2. Product Objectives

ChiGo aims to solve three major problems:

## Problem 1

Users often do not understand unfamiliar menu items.

Examples:

- Foreign language menus
- Unknown dishes
- Dietary restrictions

---

## Problem 2

Users struggle to make healthy eating decisions.

Examples:

- Calorie awareness
- Nutritional balance
- Food tracking

---

## Problem 3

Users often want company while eating but lack an easy way to coordinate meals.

Examples:

- Eating alone
- Finding dining partners
- Organizing group meals

---

# 3. Core Product Pillars

## Pillar 1

AI Menu Assistant

---

## Pillar 2

Nutrition & Health

---

## Pillar 3

Dining Social Network

---

## Pillar 4

Dining Planning

---

## Pillar 5

Restaurant Discovery

---

# 4. Functional Requirements

# 4.1 AI Menu Assistant

## Menu Translation

Users can upload or capture menu images.

System should:

- Extract text from menu
- Detect language
- Translate content
- Explain ingredients
- Explain cooking methods

Output:

- Original text
- Translation
- Ingredient breakdown
- Cuisine explanation

---

## Dish Visualization

After menu recognition:

System should display:

- Community uploaded photos
- Restaurant provided photos
- AI generated images (fallback)

Priority:

1. User-generated photos
2. Official photos
3. AI-generated images

---

## AI Dish Recommendation

Inputs:

- Dietary preferences
- Allergies
- Nutrition goals
- Previous dining history

Outputs:

- Recommended dishes
- Explanation of recommendation
- Nutrition score

---

# 4.2 Nutrition & Health

## Meal Logging

Users can:

- Upload meal photos
- Save meals
- Build meal history

System automatically creates:

- Daily food journal
- Weekly summaries

---

## Nutrition Analysis

System estimates:

- Calories
- Protein
- Fat
- Carbohydrates

Future:

- Micronutrients
- Sodium
- Fiber

---

## Dietary Profile

Store:

- Food preferences
- Allergies
- Dietary restrictions
- Fitness goals

Examples:

- Vegetarian
- Vegan
- Halal
- Kosher
- Lactose intolerant

---

## Habit Building

Features:

- Meal reminders
- Streak tracking
- Goal tracking
- Personalized insights

---

# 4.3 Dining Social Network

## User Profiles

Profile fields:

- Username
- Display name
- Bio
- University
- Instagram
- Profile picture
- Dining preferences

---

## Friend System

Support:

- Username search
- QR code add
- Contact import (future)
- Follow users

---

## Quick Dining Invite

Users can create:

- Restaurant
- Time
- Location
- Group size

Example:

"Want to grab dinner at Teppanyaki Kyoto tonight?"

Friends can join with one click.

---

## Dining Partner Matching (Experimental)

Potential feature.

Match users based on:

- Food preferences
- Reviews
- Dining habits

Status:

Research required before implementation.

---

## CMU Open Seat Mode

CMU-specific feature.

Users can indicate:

- Current dining location
- Number of available seats
- Open to strangers

Goal:

Reduce dining isolation and improve social interaction.

Example:

"My table has 2 open seats."

---

# 4.4 Dining Planning

## Group Scheduling

Inspired by When2Meet.

Features:

- Create meal event
- Invite participants
- Collect availability
- Suggest optimal time

---

## AI Meal Time Suggestion

If availability is incomplete:

System estimates best dining time based on:

- User habits
- Previous meal history
- Friend availability

---

## Calendar Integration

Support:

- Google Calendar
- Apple Calendar

Generate calendar events automatically.

---

# 4.5 Restaurant Discovery

## Restaurant Search

Powered by:

- Yelp API
- Google Maps API

Users can:

- Search restaurants
- View ratings
- View location

---

## Reservations

Phase 1:

OpenTable deep link

Phase 2:

Direct API integration

Functions:

- View availability
- Reserve tables
- Share reservation with friends

---

## Seating Visualization (Future)

Potential future feature.

Display:

- Available seating
- Crowd level
- Estimated wait times

Not included in MVP.

---

# 4.6 Community & Content

## Food Posts

Users can create posts containing:

- Dish photos
- Restaurant reviews
- Meal logs

---

## Social Feed

Feed contains:

- Friend activity
- Food discoveries
- Restaurant recommendations

---

## Universal Food Recognition Entry Point

From:

- Personal uploads
- Feed posts
- Shared photos

Users can access:

- Dish recognition
- Menu translation
- Nutrition analysis

---

# 5. User Onboarding

## Registration Methods

Support:

- Email
- Phone Number
- Google Login
- CMU Andrew Login (future)

---

## Initial Setup Questions

Collect:

### Basic Information

- Name
- University

### Dietary Preferences

- Dietary restrictions
- Allergies
- Favorite cuisines

### Meal Habits

- Typical meal times
- Meals per day

### Social Preferences

- Open to dining invitations
- Interested in finding dining partners

---

# 6. Technical Architecture

## Frontend

Framework:

- Next.js 15+
- React
- TypeScript
- Tailwind CSS

---

## Backend

Primary:

- Next.js API Routes
- Server Actions

Optional:

- Supabase Edge Functions

---

## Database

Supabase Postgres

---

## Authentication

Supabase Auth

Methods:

- Email
- Google
- Phone

---

## Storage

Supabase Storage

Stores:

- Food photos
- Profile photos
- Menu images

---

## Hosting

Vercel

---

## AI Layer

Potential Providers:

- OpenAI
- Gemini
- Claude

Responsibilities:

- Menu translation
- Dish explanation
- Nutrition estimation
- Personalized recommendations

---

## Maps

Google Maps API

---

## Restaurant Data

Yelp Fusion API

---

## Reservations

OpenTable Deep Links

Future:

OpenTable API integration

---

## Calendar

Google Calendar API

Apple Calendar Links

---

# 7. Non-Functional Requirements

## Performance

- Initial page load under 3 seconds
- API response under 5 seconds

---

## Security

- Secure authentication
- Protected user data
- Secure image storage

---

## Scalability

Architecture should support:

- Web platform
- Future Expo mobile app

Business logic should remain reusable.

---

# 8. Future Roadmap

## Phase 2

- Nutrition streaks
- Dining partner matching
- Campus rankings
- Enhanced restaurant recommendations

---

## Phase 3

- Mobile app (Expo)
- Push notifications
- Real-time chat
- Reservation integration

---

## Phase 4

- Multiple universities
- Public launch
- Advanced AI dining assistant
- Real-time seating visualization
- Broader social network beyond dining