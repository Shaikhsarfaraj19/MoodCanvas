import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MOODS = [
  { emoji: '😊', label: 'Happy', color: '#FFD700', gradient: ['#FFE259', '#FFA751'] },
  { emoji: '😌', label: 'Calm', color: '#90EE90', gradient: ['#00B4DB', '#0083B0'] },
  { emoji: '😔', label: 'Sad', color: '#87CEEB', gradient: ['#8E2DE2', '#4A00E0'] },
  { emoji: '😤', label: 'Angry', color: '#FF6B6B', gradient: ['#FF416C', '#FF4B2B'] },
  { emoji: '😰', label: 'Anxious', color: '#DDA0DD', gradient: ['#834D9B', '#D04ED6'] },
];

const MoodCanvas = () => {
  // State Management
  const [selectedMood, setSelectedMood] = useState(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const moodSelectAnim = useRef(new Animated.Value(0)).current;

  // Effects
  useEffect(() => {
    animateEntry();
  }, []);

  // Animations
  const animateEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateMoodSelect = (index) => {
    Animated.sequence([
      Animated.timing(moodSelectAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(moodSelectAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Helper Functions  // Helper Functions
  const generateInsights = () => {
    // Count words by splitting on whitespace and filtering out empty strings
    const wordCount = journalEntry.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    if (wordCount < 10) {
      toast.error('Please write at least 10 words about how you feel');
      return;
    }

    setIsLoading(true);
    fetch('https://api.a0.dev/ai/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an empathetic mental health assistant. Provide brief, caring insights about the user\'s mood and journal entry.'
          },
          {
            role: 'user',
            content: `Mood: ${selectedMood?.label}\nJournal: ${journalEntry}\nProvide a short, supportive insight.`
          }
        ]
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.completion) {
        setInsights(data.completion);
      }
    })
    .catch(error => {
      toast.error('Unable to generate insights right now');
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const saveMoodEntry = () => {
    if (!selectedMood) {
      toast.error('Please select a mood');
      return;
    }

    const newEntry = {
      id: Date.now(),
      mood: selectedMood,
      journal: journalEntry,
      timestamp: new Date(),
      insights: insights,
    };

    setMoodHistory([newEntry, ...moodHistory]);
    toast.success('Mood entry saved!');
    setJournalEntry('');
    setInsights(null);
    setSelectedMood(null);
  };

  // UI Components
  const renderHeader = () => (
    <LinearGradient
      colors={selectedMood?.gradient || ['#4c669f', '#3b5998', '#192f6a']}
      style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>MoodCanvas</Text>
        <Text style={styles.headerSubtitle}>Paint your emotions</Text>
      </View>
    </LinearGradient>
  );

  const renderMoodSelector = () => (
    <View style={styles.moodSelector}>
      <Text style={styles.sectionTitle}>How are you feeling?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodList}>
        {MOODS.map((mood, index) => (
          <TouchableOpacity
            key={mood.label}
            style={[
              styles.moodItem,
              selectedMood?.label === mood.label && styles.selectedMoodItem,
            ]}
            onPress={() => {
              setSelectedMood(mood);
              animateMoodSelect(index);
            }}>
            <Animated.Text
              style={[
                styles.moodEmoji,
                selectedMood?.label === mood.label && {
                  transform: [
                    {
                      scale: moodSelectAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.2, 1],
                      }),
                    },
                  ],
                },
              ]}>
              {mood.emoji}
            </Animated.Text>
            <Text style={styles.moodLabel}>{mood.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderJournalSection = () => (
    <Animated.View
      style={[
        styles.journalSection,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
      <Text style={styles.sectionTitle}>Express yourself</Text>
      <TextInput
        style={styles.journalInput}
        multiline
        placeholder="How are you feeling today? What's on your mind?"
        value={journalEntry}
        onChangeText={setJournalEntry}
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={styles.insightButton}
        onPress={generateInsights}
        disabled={isLoading}>
        <MaterialIcons name="psychology" size={24} color="white" />
        <Text style={styles.buttonText}>
          {isLoading ? 'Generating insights...' : 'Get AI Insights'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderInsights = () => (
    insights && (
      <Animated.View
        style={[
          styles.insightsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <LinearGradient
          colors={['#4c669f', '#3b5998']}
          style={styles.insightsGradient}>
          <MaterialIcons name="lightbulb" size={24} color="#FFD700" />
          <Text style={styles.insightsText}>{insights}</Text>
        </LinearGradient>
      </Animated.View>
    )
  );  const [expandedEntry, setExpandedEntry] = useState(null);

  const renderMoodHistory = () => (
    <View style={styles.historySection}>
      <Text style={styles.sectionTitle}>Recent Entries</Text>
      {moodHistory.map((entry) => (
        <TouchableOpacity
          key={entry.id}
          style={styles.historyCard}
          onPress={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}>
          <View style={styles.historyHeader}>
            <View style={styles.historyHeaderLeft}>
              <Text style={styles.historyEmoji}>{entry.mood.emoji}</Text>
              <Text style={styles.historyMoodLabel}>{entry.mood.label}</Text>
            </View>
            <Text style={styles.historyDate}>
              {new Date(entry.timestamp).toLocaleString()}
            </Text>
          </View>
          <Text 
            style={[
              styles.historyJournal,
              expandedEntry === entry.id && styles.historyJournalExpanded
            ]}
            numberOfLines={expandedEntry === entry.id ? undefined : 2}>
            {entry.journal}
          </Text>
          {entry.insights && expandedEntry === entry.id && (
            <View style={styles.historyInsights}>
              <MaterialIcons name="psychology" size={20} color="#4c669f" />
              <Text style={styles.historyInsightsText}>{entry.insights}</Text>
            </View>
          )}
          <View style={styles.expandIndicator}>
            <MaterialIcons 
              name={expandedEntry === entry.id ? "expand-less" : "expand-more"} 
              size={24} 
              color="#666" 
            />
          </View>
        </TouchableOpacity>
      ))}
      {moodHistory.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialIcons name="history" size={40} color="#ccc" />
          <Text style={styles.emptyStateText}>No entries yet</Text>
          <Text style={styles.emptyStateSubtext}>Your mood entries will appear here</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content}>
        {renderMoodSelector()}
        {renderJournalSection()}
        {renderInsights()}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveMoodEntry}>
          <FontAwesome5 name="save" size={20} color="white" />
          <Text style={styles.buttonText}>Save Entry</Text>
        </TouchableOpacity>
        {renderMoodHistory()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  moodSelector: {
    marginBottom: 20,
  },
  moodList: {
    paddingVertical: 8,
  },
  moodItem: {
    alignItems: 'center',
    marginRight: 20,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedMoodItem: {
    backgroundColor: '#f0f0f0',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 14,
    color: '#666',
  },
  journalSection: {
    marginBottom: 20,
  },
  journalInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    height: 150,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  insightButton: {
    backgroundColor: '#4c669f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  insightsContainer: {
    marginBottom: 20,
  },
  insightsGradient: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightsText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  historySection: {
    marginBottom: 20,
  },  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  historyMoodLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  historyDate: {
    color: '#666',
    fontSize: 12,
  },
  historyJournal: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  historyJournalExpanded: {
    marginBottom: 12,
  },
  historyInsights: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  historyInsightsText: {
    color: '#4c669f',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default MoodCanvas;