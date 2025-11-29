# MOVT App - Professional Cards Feature Documentation

## Overview
This document describes the functionality of the professional trainer cards feature in the MOVT App, which allows users to discover and view professional trainer profiles by clicking on cards in the map interface.

## Feature Components

### 1. Map Screen (src/screens/App/map/mapScreen.tsx)
The map screen is the primary interface where users can discover professional trainers near their location.

#### Key Components:
- **MapView**: Displays user location and area of interest
- **DetailsBottomSheet**: Shows professional trainer cards when activated
- **TrainingSelector**: Allows users to select different training types
- **MapSettingSheet**: Provides configuration options for the map view

#### Professional Trainer Cards:
- **Activation**: Cards are displayed when the globe icon is pressed
- **Data Structure**: Each trainer card contains:
  - `id`: Unique identifier
  - `name`: Trainer's full name
  - `description`: Professional background and specialization
  - `rating`: Number of evaluations (displayed as "X avaliações")
  - `imageUrl`: URL of the trainer's profile image

### 2. Navigation System
The feature implements a seamless navigation flow from the map screen to professional profiles.

#### Navigation Flow:
1. User clicks the globe icon on the map screen
2. DetailsBottomSheet appears with professional trainer cards
3. User clicks on a specific trainer card
4. App navigates to ProfilePJ screen with all trainer data

#### Technical Implementation:
- `handleTrainerPress(trainer: PersonalTrainer)` function handles card presses
- Navigation: `navigation.navigate("ProfilePJ", { trainer })`
- Complete trainer object is passed as route parameter

### 3. Professional Profile Screen (src/screens/App/profile/profilePJScreen.tsx)
The profile screen displays comprehensive information about the selected professional trainer.

#### Data Inheritance:
- **Image Handling**: 
  - `imageUrl` from map screen is mapped to both `photoUrl` and `coverUrl`
  - Used for profile avatar and background image
- **Professional Information**:
  - Name, description, years of experience
  - Credentials, education, and specialties
  - Ratings and workout statistics
  - Address information

## Technical Implementation Details

### Data Structure
```typescript
interface PersonalTrainer {
  id: string;
  name: string;
  description: string;
  rating: number;
  imageUrl: string;
}
```

### Navigation Parameters
- Route: "ProfilePJ"
- Parameter: `{ trainer: PersonalTrainer }`
- Profile screen extracts data using `route.params`

### Sample Data
The map screen includes sample trainer data for testing:
- Oliver Augusto (ID: 1)
- Hector Oliveira (ID: 2)
- Cláudio Matias (ID: 3)
- Andressa Fontinelle (ID: 4)
- Bruna Carvalho (ID: 5)

## User Experience Flow

### 1. Discovery Phase
1. User opens map screen showing their current location
2. User taps the globe icon to open professional finder
3. DetailsBottomSheet slides up with available professional cards
4. User scrolls through available professionals near their area

### 2. Selection Phase
1. User finds an interesting professional trainer
2. User taps on the trainer's card
3. App navigates to the ProfilePJ screen
4. All trainer data is displayed in a professional profile layout

### 3. Profile View
1. Professional's cover image and profile photo display
2. Comprehensive professional information is shown
3. Additional features like scheduling may be available
4. User can return to map to select different professionals

## Key Code Components

### Map Screen Handler
```typescript
const handleTrainerPress = (trainer: PersonalTrainer) => {
  navigation.navigate("ProfilePJ", { trainer });
};
```

### Profile Screen Data Reception
```typescript
const { trainer: routeTrainer } = route.params as { trainer?: TrainerData };
```

## Benefits
- **Seamless Experience**: One-click navigation from discovery to detailed profile
- **Complete Data Transfer**: All trainer information is available on profile screen
- **Professional Presentation**: Clean, structured display of professional credentials
- **Scalable Design**: Easy to add more trainer data fields in the future

## Future Considerations
- Integration with real backend API instead of sample data
- Enhanced filtering options in the trainer card list
- Direct contact options from profile screen
- User reviews and ratings display

## Version Information
- **Feature Version**: 1.0
- **Status**: Implemented and functional
- **Last Updated**: November 2025
- **Components**: mapScreen.tsx, profilePJScreen.tsx, DetailsBottomSheet.tsx