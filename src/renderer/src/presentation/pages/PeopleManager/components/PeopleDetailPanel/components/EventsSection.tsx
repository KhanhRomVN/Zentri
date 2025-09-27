// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/EventsSection.tsx
import React, { useState } from 'react'
import { Calendar, Plus, Clock, MapPin, Users, Tag, Trash2, Edit } from 'lucide-react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import { cn } from '../../../../../../shared/lib/utils'
import { Person } from '../../../types'

interface EventsSectionProps {
  person: Person
  className?: string
  onUpdatePerson?: (id: string, updates: Partial<Person>) => Promise<boolean>
}

const EventsSection: React.FC<EventsSectionProps> = ({ person, className, onUpdatePerson }) => {
  const [events, setEvents] = useState<any[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    event_type: '',
    event_date: '',
    event_end_date: '',
    location: '',
    description: ''
  })

  const eventTypeOptions = [
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'travel', label: 'Travel' },
    { value: 'medical', label: 'Medical' },
    { value: 'education', label: 'Education' },
    { value: 'career', label: 'Career' }
  ]

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.event_date) return

    const event = {
      id: Date.now().toString(),
      ...newEvent,
      created_at: new Date().toISOString()
    }

    setEvents((prev) => [...prev, event])
    setNewEvent({
      title: '',
      event_type: '',
      event_date: '',
      event_end_date: '',
      location: '',
      description: ''
    })
    setShowAddEvent(false)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'birthday':
        return '🎂'
      case 'anniversary':
        return '💝'
      case 'meeting':
        return '🤝'
      case 'appointment':
        return '📅'
      case 'milestone':
        return '🏆'
      case 'achievement':
        return '⭐'
      case 'travel':
        return '✈️'
      case 'medical':
        return '🏥'
      case 'education':
        return '🎓'
      case 'career':
        return '💼'
      default:
        return '📌'
    }
  }

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pl-1">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Events & Timeline
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
            Important events and milestones for {person.full_name}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddEvent(true)}
          className="bg-purple-600 hover:bg-purple-700"
          disabled
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Event (Soon)
        </Button>
      </div>

      {/* Add Event Form */}
      {showAddEvent && (
        <div className="bg-card-background rounded-lg border border-border-default p-4">
          <h4 className="font-medium text-text-primary mb-3">Add New Event</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CustomInput
              label="Event Title"
              value={newEvent.title}
              onChange={(value) => setNewEvent((prev) => ({ ...prev, title: value }))}
              placeholder="Event title"
              variant="filled"
              size="sm"
            />

            <CustomCombobox
              label="Event Type"
              value={newEvent.event_type}
              options={eventTypeOptions}
              onChange={(value) =>
                setNewEvent((prev) => ({ ...prev, event_type: value as string }))
              }
              placeholder="Select event type"
              size="sm"
            />

            <CustomInput
              label="Start Date & Time"
              type="datetime-local"
              value={newEvent.event_date}
              onChange={(value) => setNewEvent((prev) => ({ ...prev, event_date: value }))}
              variant="filled"
              size="sm"
            />

            <CustomInput
              label="End Date & Time (Optional)"
              type="datetime-local"
              value={newEvent.event_end_date}
              onChange={(value) => setNewEvent((prev) => ({ ...prev, event_end_date: value }))}
              variant="filled"
              size="sm"
            />

            <CustomInput
              label="Location"
              value={newEvent.location}
              onChange={(value) => setNewEvent((prev) => ({ ...prev, location: value }))}
              placeholder="Event location"
              variant="filled"
              size="sm"
              className="md:col-span-2"
            />

            <CustomInput
              label="Description"
              value={newEvent.description}
              onChange={(value) => setNewEvent((prev) => ({ ...prev, description: value }))}
              placeholder="Event description"
              variant="filled"
              size="sm"
              multiline
              rows={3}
              className="md:col-span-2"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddEvent}
              disabled={!newEvent.title || !newEvent.event_date}
            >
              Add Event
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddEvent(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Events Timeline */}
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card-background rounded-lg border border-border-default p-4 hover:border-border-hover transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-lg">
                    {getEventIcon(event.event_type)}
                  </div>

                  <div>
                    <h5 className="font-medium text-text-primary">{event.title}</h5>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Tag className="h-3 w-3" />
                        {eventTypeOptions.find((opt) => opt.value === event.event_type)?.label ||
                          'Event'}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(event.event_date)}
                      </span>

                      {event.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="p-1 h-6 w-6" disabled>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {event.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{event.description}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card-background rounded-lg border border-border-default p-8 text-center">
          <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">No Events Added</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Track important events, meetings, and milestones for {person.full_name}.
          </p>
          <Button variant="outline" onClick={() => setShowAddEvent(true)} disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add First Event (Coming Soon)
          </Button>
        </div>
      )}

      {/* Coming Soon Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              Events Timeline Feature Coming Soon
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              We're building a comprehensive events system with calendar integration, reminders, and
              timeline visualization to help you track important moments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventsSection
