/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { SavedEventsView } from './components/SavedEventsView';
import { PhotoLayoutEditor } from './components/PhotoLayoutEditor';
import { BoothKiosk } from './components/BoothKiosk';
import { PythonWindowsHub } from './components/PythonWindowsHub';
import { GalleryTab } from './components/GalleryTab';
import { SettingsTab } from './components/SettingsTab';
import { QRCodeModal } from './components/QRCodeModal';
import { AppTab, HistoryStrip, PhotoboothSettings, EventItem, LayoutTemplate } from './types';
import { INITIAL_EVENTS, PRESET_TEMPLATES } from './data/defaultTemplates';

const INITIAL_SETTINGS: PhotoboothSettings = {
  eventTitle: 'Testing',
  eventSubtitle: 'Touch Screen to Begin',
  showDate: true,
  eventDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  countdownSeconds: 3,
  mirrorCamera: true,
  soundEnabled: true,
  flashEnabled: true,
  autoPrint: false,
  cameraResolution: '1080p',
  printerName: 'EPSON L8050 Series (2x6 Cut)',
  paperType: '2x6-strip',
  copiesPerSession: 2,
  kioskPin: '1234',
  kioskLock: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('events');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);

  // Events management with localStorage persistence
  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      const saved = localStorage.getItem('lumabooth_events');
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return events[0]?.id || 'event-testing';
  });

  const [activeEditingTemplateId, setActiveEditingTemplateId] = useState<string | null>(null);

  // Current active event
  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0] || INITIAL_EVENTS[0];

  // Current active template
  const currentTemplate: LayoutTemplate = 
    currentEvent?.templates?.find((t) => t.id === (activeEditingTemplateId || currentEvent.selectedTemplateId)) ||
    currentEvent?.templates?.[0] ||
    PRESET_TEMPLATES[0];

  // Settings with localStorage persistence
  const [settings, setSettings] = useState<PhotoboothSettings>(() => {
    try {
      const saved = localStorage.getItem('photobooth_settings');
      return saved ? { ...INITIAL_SETTINGS, ...JSON.parse(saved) } : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Session gallery with localStorage persistence
  const [gallery, setGallery] = useState<HistoryStrip[]>(() => {
    try {
      const saved = localStorage.getItem('photobooth_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lumabooth_events', JSON.stringify(events));
    } catch {
      // ignore
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('photobooth_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('photobooth_gallery', JSON.stringify(gallery));
    } catch {
      // ignore
    }
  }, [gallery]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Event handlers
  const handleCreateEvent = () => {
    const name = prompt('Enter new event name:', `Event ${new Date().toLocaleDateString()}`);
    if (!name) return;

    const newEvent: EventItem = {
      id: `event-${Date.now()}`,
      name: name.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      selectedTemplateId: 'carelon-broker-strip',
      templates: PRESET_TEMPLATES,
      captureModes: { photo: true, gif: true, boomerang: false, video: false },
      features: {
        aiPortraits: false,
        effects: true,
        digitalProps: true,
        beautyFilter: true,
        watermark: true,
        postProcessing: true,
        disclaimer: false,
        backgroundRemoval: false,
        survey: false,
      },
      printing: {
        printAutomatically: false,
        displayPrintButton: true,
        mainPrinter: 'EPSON L8050 Series',
        secondaryPrinter: '',
        print2PerPage: true,
        paperSize: '2x6',
      },
      sharing: {
        email: true,
        replyTo: 'no-reply@mail.fotoshare.co',
        emailSubject: `Your ${name} photo`,
        sms: true,
        countryCode: '1',
        smsMessage: `Your ${name} photo is ready!`,
      },
    };

    setEvents((prev) => [newEvent, ...prev]);
    setSelectedEventId(newEvent.id);
  };

  const handleRenameEvent = (id: string, newName: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, name: newName, updatedAt: Date.now() } : e))
    );
  };

  const handleDeleteEvent = (id: string) => {
    const remaining = events.filter((e) => e.id !== id);
    setEvents(remaining);
    if (selectedEventId === id && remaining[0]) {
      setSelectedEventId(remaining[0].id);
    }
  };

  const handleDuplicateEvent = (id: string) => {
    const source = events.find((e) => e.id === id);
    if (!source) return;

    const clone: EventItem = {
      ...source,
      id: `event-${Date.now()}`,
      name: `${source.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      templates: source.templates.map((t) => ({ ...t, id: `tpl-${Date.now()}-${Math.random()}` })),
    };

    setEvents((prev) => [clone, ...prev]);
    setSelectedEventId(clone.id);
  };

  const handleUpdateEvent = (id: string, updates: Partial<EventItem>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e))
    );
  };

  const handleOpenLayoutEditor = (eventId: string, templateId?: string) => {
    setSelectedEventId(eventId);
    if (templateId) {
      setActiveEditingTemplateId(templateId);
    }
    setActiveTab('layout-editor');
  };

  const handleSaveTemplate = (updatedTemplate: LayoutTemplate) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== selectedEventId) return evt;
        const exists = evt.templates.some((t) => t.id === updatedTemplate.id);
        const updatedTemplates = exists
          ? evt.templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
          : [...evt.templates, updatedTemplate];

        return {
          ...evt,
          updatedAt: Date.now(),
          templates: updatedTemplates,
          selectedTemplateId: updatedTemplate.id,
        };
      })
    );
  };

  const handleLaunchEvent = (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (target) {
      setSelectedEventId(eventId);
      setSettings((prev) => ({
        ...prev,
        eventTitle: target.name,
        printerName: target.printing.mainPrinter || prev.printerName,
        autoPrint: target.printing.printAutomatically,
      }));
    }
    setActiveTab('kiosk');
  };

  const handleUpdateSettings = (updated: Partial<PhotoboothSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleResetDefaults = () => {
    setSettings(INITIAL_SETTINGS);
  };

  const handleSaveToGallery = (strip: HistoryStrip) => {
    setGallery((prev) => [strip, ...prev]);
  };

  const handleClearGallery = () => {
    setGallery([]);
  };

  return (
    <div className="min-h-screen bg-[#141416] text-[#F3F4F6] flex flex-col justify-between selection:bg-pink-500 selection:text-white">
      {/* 1. Windows 11 Chrome Title Bar */}
      <WindowsTitleBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        soundEnabled={settings.soundEnabled}
        setSoundEnabled={(enabled) => handleUpdateSettings({ soundEnabled: enabled })}
        eventTitle={currentEvent?.name || settings.eventTitle}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        {/* TAB 1: LUMABOOTH SAVED EVENTS */}
        {activeTab === 'events' && (
          <SavedEventsView
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            onCreateEvent={handleCreateEvent}
            onRenameEvent={handleRenameEvent}
            onDeleteEvent={handleDeleteEvent}
            onDuplicateEvent={handleDuplicateEvent}
            onOpenLayoutEditor={handleOpenLayoutEditor}
            onLaunchEvent={handleLaunchEvent}
            onUpdateEvent={handleUpdateEvent}
          />
        )}

        {/* TAB 2: LUMABOOTH PHOTO LAYOUT EDITOR */}
        {activeTab === 'layout-editor' && (
          <PhotoLayoutEditor
            template={currentTemplate}
            onSaveTemplate={handleSaveTemplate}
            onBackToEvents={() => setActiveTab('events')}
            eventName={currentEvent?.name || 'Event'}
          />
        )}

        {/* TAB 3: LIVE BOOTH KIOSK */}
        {activeTab === 'kiosk' && (
          <BoothKiosk
            settings={settings}
            onSaveToGallery={handleSaveToGallery}
            onOpenQR={(url) => setQrModalUrl(url)}
            customTemplate={currentTemplate}
            onBackToEvents={() => setActiveTab('events')}
          />
        )}

        {/* TAB 4: WINDOWS PYTHON APP & SOURCE HUB */}
        {activeTab === 'python-source' && <PythonWindowsHub />}

        {/* TAB 5: SESSION GALLERY */}
        {activeTab === 'gallery' && (
          <GalleryTab
            gallery={gallery}
            onClearGallery={handleClearGallery}
            onOpenQR={(url) => setQrModalUrl(url)}
            onSelectStrip={() => {}}
          />
        )}

        {/* TAB 6: CONFIG */}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </main>

      {/* 3. Windows Native Taskbar / Kiosk Status Bar */}
      <footer className="bg-[#0D0D0E] border-t border-neutral-800/80 px-4 py-2 text-[11px] font-mono text-neutral-400 flex flex-wrap items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>EVENT: {currentEvent?.name || 'Testing'}</span>
          </span>
          <span>·</span>
          <span>TEMPLATE: {currentTemplate?.name || 'Carelon Broker 3-Strip'}</span>
          <span>·</span>
          <span>MAIN PRINTER: {currentEvent?.printing?.mainPrinter || 'EPSON L8050'}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>SAVED EVENTS: {events.length}</span>
          <span>·</span>
          <span>SESSIONS TAKEN: {gallery.length}</span>
          <span>·</span>
          <span className="text-pink-400 font-semibold">LumaBooth Windows 11</span>
        </div>
      </footer>

      {/* QR Code Modal for scanning to mobile phone */}
      {qrModalUrl && (
        <QRCodeModal
          dataUrl={qrModalUrl}
          onClose={() => setQrModalUrl(null)}
          eventTitle={currentEvent?.name || settings.eventTitle}
        />
      )}
    </div>
  );
}
