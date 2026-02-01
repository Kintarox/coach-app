import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// --- STYLES (Mit Standard-Schriftart Helvetica) ---
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 30,
    fontFamily: 'Helvetica', // Standard-Schrift (Fehlerfrei!)
    backgroundColor: '#ffffff',
    fontSize: 10,
    color: '#1D1D1F',
  },
  
  // Header
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold', // Fett
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 15,
  },
  headerMetaText: {
    fontSize: 9,
    color: '#555',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },

  // Phasen Titel
  phaseHeaderBlock: {
    marginBottom: 10,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F3F4F6', 
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
  },
  phaseTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#111',
  },

  // Container
  exerciseContainer: {
    marginBottom: 10,
  },
  
  // Übung Header
  exerciseHeader: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
    paddingBottom: 8,
  },
  exerciseTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  metaBadge: {
    fontSize: 9,
    color: '#333',
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
  },

  // BILD
  imageContainer: {
    height: 280, // Großes Bild
    width: '100%',
    backgroundColor: '#F9FAFB',
    marginBottom: 15,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'solid',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain', 
  },
  placeholderWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginTop: 5,
  },

  // TEXT BLÖCKE
  sectionBlock: {
    marginBottom: 12,
  },
  label: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#374151',
    textAlign: 'justify',
  },
  
  // COACHING
  coachingBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 6,
    marginTop: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    borderLeftStyle: 'solid',
  },
  coachingLabel: {
    color: '#1E40AF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  coachingText: {
    color: '#1E3A8A',
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Helvetica-Oblique', // Kursiv
  },

  // MATERIAL
  materialBox: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialTag: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
  },
  materialText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderTopStyle: 'solid',
    paddingTop: 10,
  }
});

// --- HELPER ---

const formatText = (text: string) => {
    if (!text) return "";
    return text.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
};

const getPhaseTitle = (key: string) => {
  switch(key) {
    case 'warmup': return '1. Einstimmen / Aufwärmen';
    case 'main1': return '2. Hauptteil I - Technik';
    case 'main2': return '3. Hauptteil II - Spielform';
    case 'coolDown': return '4. Ausklang';
    default: return key;
  }
};

const getPhaseColor = (key: string) => {
    switch(key) {
      case 'warmup': return '#F97316'; 
      case 'main1': return '#2563EB';  
      case 'main2': return '#9333EA';  
      case 'coolDown': return '#10B981'; 
      default: return '#000000';
    }
};

// --- PDF KOMPONENTE ---

export const TrainingPlanPDF = ({ plan }: { plan: any }) => {
  const phases = ['warmup', 'main1', 'main2', 'coolDown'];
  
  const firstNonEmptyPhaseIndex = phases.findIndex(key => plan.content?.[key]?.length > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{plan.title}</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerMetaText}>DATUM: {new Date(plan.date).toLocaleDateString('de-DE')}</Text>
            <Text style={styles.headerMetaText}>ZEIT: {plan.time || '19:00'} UHR</Text>
            {plan.focus && <Text style={styles.headerMetaText}>FOKUS: {plan.focus}</Text>}
          </View>
        </View>

        {/* PHASEN LOOP */}
        {phases.map((phaseKey, phaseIndex) => {
          const exercises = plan.content?.[phaseKey] || [];
          if (exercises.length === 0) return null;

          return (
            <React.Fragment key={phaseKey}>
              {exercises.map((ex: any, idx: number) => {
                
                const isGlobalFirstExercise = (phaseIndex === firstNonEmptyPhaseIndex && idx === 0);
                const shouldBreak = !isGlobalFirstExercise;

                return (
                  <View key={idx} break={shouldBreak} style={styles.exerciseContainer}>
                    
                    {/* Phase Header */}
                    {idx === 0 && (
                        <View style={[styles.phaseHeaderBlock, { borderLeftColor: getPhaseColor(phaseKey) }]}>
                            <Text style={[styles.phaseTitle, { color: getPhaseColor(phaseKey) }]}>
                                {getPhaseTitle(phaseKey)}
                            </Text>
                        </View>
                    )}

                    <View wrap={false}> 

                      {/* Exercise Header */}
                      <View style={styles.exerciseHeader}>
                        <Text style={styles.exerciseTitle}>{ex.title}</Text>
                        <View style={styles.exerciseMetaRow}>
                            <Text style={styles.metaBadge}>{ex.duration} MIN</Text>
                            <Text style={styles.metaBadge}>{ex.min_players}-{ex.max_players} SPIELER</Text>
                            <Text style={styles.metaBadge}>{ex.category}</Text>
                            {ex.age_groups && ex.age_groups.length > 0 && (
                                <Text style={styles.metaBadge}>{ex.age_groups.join(', ')}</Text>
                            )}
                        </View>
                      </View>

                      {/* Bild */}
<View style={styles.imageContainer}>
    {ex.image_url ? (
    <Image 
        src={ex.image_url} 
        style={styles.exerciseImage} 
    />
    ) : (
    <View style={styles.placeholderWrapper}>
        <Text style={{ fontSize: 40, opacity: 0.2 }}>⚽</Text>
        <Text style={styles.placeholderText}>Kein Bild</Text>
    </View>
    )}
</View>

                      {/* Beschreibung */}
                      <View style={styles.sectionBlock}>
                        <Text style={styles.label}>Ablauf & Aufbau:</Text>
                        <Text style={styles.text}>
                            {formatText(ex.description) || "Keine Beschreibung vorhanden."}
                        </Text>
                      </View>

                      {/* Coaching Punkte */}
                      {ex.coaching_points && (
                        <View style={styles.coachingBox}>
                            <Text style={styles.coachingLabel}>Coaching Punkte:</Text>
                            <Text style={styles.coachingText}>
                                {formatText(ex.coaching_points)}
                            </Text>
                        </View>
                      )}

                      {/* Material (Rein Text) */}
                      {ex.materials && (
                        <View style={styles.materialBox}>
                            <Text style={[styles.label, { width: '100%', marginBottom: 4 }]}>Material:</Text>
                            {ex.materials.split(',').map((mat: string, i: number) => {
                                const trimmedMat = mat.trim();
                                if (!trimmedMat) return null;
                                return (
                                    <View key={i} style={styles.materialTag}>
                                        <Text style={styles.materialText}>{trimmedMat}</Text>
                                    </View>
                                );
                            })}
                        </View>
                      )}
                    </View>

                  </View>
                );
              })}
            </React.Fragment>
          );
        })}

        <Text style={styles.footer} fixed>
          Trainingseinheit erstellt mit Football Academy Planner
        </Text>

      </Page>
    </Document>
  );
};