import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../../styles/colors';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.grayscale[0],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.grayscale[0],
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grayscale[10],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.chathams_blue[600],
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    marginLeft: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.grayscale[0],
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.grayscale[45],
    fontWeight: '500',
  },
  
  // StoryBar Styles
  storyBarContainer: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grayscale[10],
    backgroundColor: COLORS.grayscale[0],
  },
  storyItem: {
    alignItems: 'center',
    marginLeft: 16,
  },
  storyAvatarContainer: {
    padding: 3,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.chathams_blue[400],
    marginBottom: 6,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.grayscale[5],
  },
  storyUsername: {
    fontSize: 11,
    color: COLORS.grayscale[80],
    maxWidth: 70,
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.chathams_blue[500],
    borderRadius: 10,
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.grayscale[0],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // PostCard Styles
  card: {
    backgroundColor: COLORS.grayscale[0],
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: COLORS.grayscale[5],
  },
  cardUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.grayscale[100],
  },
  cardLocation: {
    fontSize: 11,
    color: COLORS.grayscale[45],
  },
  mediaContainer: {
    width: width,
    aspectRatio: 1,
    backgroundColor: COLORS.grayscale[5],
  },
  media: {
    width: '100%',
    height: '100%',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 18,
  },
  statsContainer: {
    paddingHorizontal: 14,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.grayscale[100],
    marginBottom: 4,
  },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  captionUser: {
    fontWeight: '700',
    marginRight: 6,
  },
  captionText: {
    fontSize: 14,
    color: COLORS.grayscale[90],
    lineHeight: 18,
  },
  viewComments: {
    fontSize: 14,
    color: COLORS.grayscale[45],
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.grayscale[30],
    marginTop: 6,
    textTransform: 'uppercase',
  },
  quickComment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickCommentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
  },
  quickCommentInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.grayscale[45],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.grayscale[0],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    paddingTop: 12,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.grayscale[20],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grayscale[10],
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.grayscale[100],
  },
  modalList: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grayscale[5],
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.grayscale[100],
  },
  commentBody: {
    fontSize: 13,
    color: COLORS.grayscale[80],
    lineHeight: 18,
    marginTop: 1,
  },
  commentDate: {
    fontSize: 12,
    color: COLORS.grayscale[30],
    lineHeight: 18, // igual ao commentUser para alinhar na mesma linha
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.grayscale[10],
    backgroundColor: COLORS.grayscale[0],
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, // Redução sutil na área segura
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 11,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.grayscale[5],
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.grayscale[100],
  },
  sendButton: {
    marginLeft: 12,
    padding: 4,
  },
  postButton: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.chathams_blue[500],
    marginLeft: 10,
  },
  noComments: {
    textAlign: 'center',
    marginTop: 40,
    color: COLORS.grayscale[40],
    fontSize: 14,
  },

  // Swipe-to-delete styles
  swipeDeleteContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    backgroundColor: '#EF4444',
    borderRadius: 0,
  },
  swipeDeleteBtn: {
    width: 72,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // ActionSheet Styles
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grayscale[5],
  },
  actionSheetText: {
    fontSize: 16,
    color: COLORS.grayscale[100],
    marginLeft: 15,
    fontWeight: '500',
  },

  // Edit Screen Styles (Premium)
  editHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grayscale[10],
    backgroundColor: COLORS.grayscale[0],
  },
  editCancelText: {
    fontSize: 16,
    color: COLORS.grayscale[100],
  },
  editTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.grayscale[100],
  },
  editDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary_green,
  },
  editAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  editAuthorPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  editUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.grayscale[100],
  },
  editMediaPreviewContainer: {
    width: '100%',
    height: 340,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editMediaImage: {
    width: 300,
    height: 340,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: COLORS.grayscale[10],
  },
  editCaptionInput: {
    padding: 16,
    fontSize: 15,
    color: COLORS.grayscale[100],
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sheetPortal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: "box-none",
  },
});