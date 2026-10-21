const MessageConstants = {
  validation: {
    id: 'ID must be provided and valid',
    email: 'Not a valid Email address',
    name: {
      minimumLength: 'Name must be at least 2 characters',
    },
    password: {
      minimumLength: 'Password must be at least 8 characters',
      maximumLength: 'Password must be at most 32 characters',
      containsUpperCase: 'Password must contain at least one uppercase letter',
      containsLowerCase: 'Password must contain at least one lowercase letter',
      containsNumber: 'Password must contain at least one number',
      containsSpecialCharacter: 'Password must contain at least one special character',
    },
    role: "User role must be either 'USER' or 'ADMIN'",
    landmark: {
      codeRequired: 'Landmark code is required',
      nameRequired: 'Landmark name is required',
      widthMetersRequired: 'Width in meters is required and must be positive',
      heightMetersRequired: 'Height in meters is required and must be positive',
    },
    viewpoint: {
      viewpointIdRequired: 'Viewpoint ID is required',
      floorIdRequired: 'Floor ID is required',
      titleRequired: 'Viewpoint title is required',
      coordinatesRequired: 'Latitude and Longitude are required',
    },
    audio: {
      languageRequired: 'Language code is required',
      audioUrlRequired: 'Audio asset URL is required',
      durationRequired: 'Audio duration is required',
    },
    ticket: {
      tokenRequired: 'Ticket token is required',
      tierRequired: 'Ticket tier must be full_access, arena_only, or general',
      validUntilRequired: 'Ticket expiration date is required',
    },
  },
  responseMessage: {
    authController: {
      signInSuccessful: 'Sign in successful',
      signUpSuccessful: 'User registered successfully',
      logoutSuccessful: 'Logout successful',
      passwordChangeSuccessful: 'Password changed successfully',
      profileRetrieved: 'User profile retrieved successfully',
    },
    landmarkController: {
      landmarksRetrieved: 'Landmarks retrieved successfully',
      landmarkRetrieved: 'Landmark details retrieved successfully',
      landmarkCreated: 'Landmark created successfully',
      landmarkUpdated: 'Landmark updated successfully',
      landmarkRemoved: 'Landmark removed successfully',
    },
    viewpointController: {
      viewpointsRetrieved: 'Viewpoints retrieved successfully',
      viewpointRetrieved: 'Viewpoint details retrieved successfully',
      viewpointCreated: 'Viewpoint created successfully',
      viewpointUpdated: 'Viewpoint updated successfully',
      viewpointRemoved: 'Viewpoint removed successfully',
    },
    audioController: {
      audioTracksRetrieved: 'Audio tracks retrieved successfully',
      audioTrackRetrieved: 'Audio track details retrieved successfully',
      audioTrackCreated: 'Audio track created successfully',
      audioTrackUpdated: 'Audio track updated successfully',
      audioTrackRemoved: 'Audio track removed successfully',
    },
    ticketController: {
      ticketValidated: 'Ticket validated successfully',
      ticketsRetrieved: 'Tickets retrieved successfully',
      ticketRetrieved: 'Ticket details retrieved successfully',
      ticketCreated: 'Ticket created successfully',
      ticketUpdated: 'Ticket updated successfully',
      ticketRemoved: 'Ticket removed successfully',
    },
    syncController: {
      manifestRetrieved: 'Sync manifest retrieved successfully',
      bundleRetrieved: 'Offline tour package retrieved successfully',
      floorsRetrieved: 'Floors retrieved successfully',
      floorRetrieved: 'Floor details retrieved successfully',
      languagesRetrieved: 'Languages retrieved successfully',
    },
  },
  errorMessage: {
    authService: {
      userNotFound: 'User not found',
      userAlreadyExists: 'User with this email already exists',
      invalidCredential: 'Invalid email or password',
      unauthorized: 'Authentication required',
      forbidden: 'Admin privileges required',
    },
    landmarkService: {
      landmarkNotFound: 'Landmark not found',
      landmarkAlreadyExists: 'Landmark with this code already exists',
    },
    viewpointService: {
      viewpointNotFound: 'Viewpoint not found',
      floorNotFound: 'Floor not found',
    },
    audioService: {
      audioTrackNotFound: 'Audio track not found',
    },
    ticketService: {
      ticketNotFound: 'Ticket token not found',
      ticketDeactivated: 'Ticket has been deactivated',
      ticketExpired: 'Ticket has expired',
      ticketNotYetActive: 'Ticket is not yet active',
      maxActivationsExceeded: 'Ticket maximum device activations exceeded',
      invalidToken: 'Invalid ticket token',
    },
    syncService: {
      manifestNotFound: 'Sync manifest not found',
    },
  },
};

export default MessageConstants;
