// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/ProfessionalInfoSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import CustomTag from '../../../../../../components/common/CustomTag'
import { cn } from '../../../../../../shared/lib/utils'
import { Person } from '../../../types'
import {
  Briefcase,
  Building,
  GraduationCap,
  Award,
  Languages,
  Code,
  Check,
  Plus,
  Minus,
  Calendar
} from 'lucide-react'

interface ProfessionalInfoSectionProps {
  person: Person
  className?: string
  onUpdatePerson?: (id: string, updates: Partial<Person>) => Promise<boolean>
}

const PROFICIENCY_OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'native', label: 'Native' }
]

const ProfessionalInfoSection: React.FC<ProfessionalInfoSectionProps> = ({
  person,
  className,
  onUpdatePerson
}) => {
  // Professional information state
  const [occupation, setOccupation] = useState(person.occupation || '')
  const [employer, setEmployer] = useState(person.employer || '')
  const [jobTitle, setJobTitle] = useState(person.job_title || '')
  const [taxId, setTaxId] = useState(person.tax_identification_number || '')
  const [skills, setSkills] = useState<string[]>(person.skills || [])
  const [languages, setLanguages] = useState(person.languages || [])
  const [certifications, setCertifications] = useState(person.certifications || [])
  const [workExperience, setWorkExperience] = useState(person.work_experience || [])
  const [education, setEducation] = useState(person.education || [])

  // Loading and status states
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  const handleSaveField = async (field: string, value: any) => {
    if (!person.id || !onUpdatePerson) return

    try {
      setSavingField(field)
      const updates: Partial<Person> = {}

      switch (field) {
        case 'occupation':
          updates.occupation = value as string
          break
        case 'employer':
          updates.employer = value as string
          break
        case 'job_title':
          updates.job_title = value as string
          break
        case 'tax_identification_number':
          updates.tax_identification_number = value as string
          break
        case 'skills':
          updates.skills = value as string[]
          break
        case 'languages':
          updates.languages = value as any[]
          break
        case 'certifications':
          updates.certifications = value as any[]
          break
        case 'work_experience':
          updates.work_experience = value as any[]
          break
        case 'education':
          updates.education = value as any[]
          break
        default:
          return
      }

      const success = await onUpdatePerson(person.id, updates)
      setSaveStatus((prev) => ({ ...prev, [field]: success ? 'success' : 'error' }))

      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [field]: null }))
      }, 2000)
    } catch (error) {
      console.error(`Error saving ${field}:`, error)
      setSaveStatus((prev) => ({ ...prev, [field]: 'error' }))
    } finally {
      setSavingField(null)
    }
  }

  const renderStatusIcon = (
    field: string,
    hasChanged: boolean,
    currentValue: any,
    originalValue: any
  ) => {
    if (savingField === field) {
      return <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
    }

    if (saveStatus[field] === 'success') {
      return <Check className="h-3 w-3 text-green-600" />
    }

    if (saveStatus[field] === 'error') {
      return <div className="text-red-600 text-xs">!</div>
    }

    if (hasChanged) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSaveField(field, currentValue)}
          className="p-0.5 h-4 w-4 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={savingField !== null}
        >
          <Check className="h-2 w-2" />
        </Button>
      )
    }

    return undefined
  }

  // Language management
  const addLanguage = () => {
    const newLanguages = [...languages, { language: '', proficiency: 'basic' }]
    setLanguages(newLanguages)
  }

  const updateLanguage = (index: number, field: string, value: string) => {
    const newLanguages = [...languages]
    newLanguages[index] = { ...newLanguages[index], [field]: value }
    setLanguages(newLanguages)
  }

  const removeLanguage = (index: number) => {
    const newLanguages = languages.filter((_, i) => i !== index)
    setLanguages(newLanguages)
    handleSaveField('languages', newLanguages)
  }

  // Work experience management
  const addWorkExperience = () => {
    const newExperience = [
      ...workExperience,
      {
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        description: ''
      }
    ]
    setWorkExperience(newExperience)
  }

  const updateWorkExperience = (index: number, field: string, value: string) => {
    const newExperience = [...workExperience]
    newExperience[index] = { ...newExperience[index], [field]: value }
    setWorkExperience(newExperience)
  }

  const removeWorkExperience = (index: number) => {
    const newExperience = workExperience.filter((_, i) => i !== index)
    setWorkExperience(newExperience)
    handleSaveField('work_experience', newExperience)
  }

  // Education management
  const addEducation = () => {
    const newEducation = [
      ...education,
      {
        institution: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        grade: ''
      }
    ]
    setEducation(newEducation)
  }

  const updateEducation = (index: number, field: string, value: string) => {
    const newEducation = [...education]
    newEducation[index] = { ...newEducation[index], [field]: value }
    setEducation(newEducation)
  }

  const removeEducation = (index: number) => {
    const newEducation = education.filter((_, i) => i !== index)
    setEducation(newEducation)
    handleSaveField('education', newEducation)
  }

  // Certification management
  const addCertification = () => {
    const newCertifications = [
      ...certifications,
      {
        name: '',
        issuing_organization: '',
        issue_date: '',
        expiry_date: ''
      }
    ]
    setCertifications(newCertifications)
  }

  const updateCertification = (index: number, field: string, value: string) => {
    const newCertifications = [...certifications]
    newCertifications[index] = { ...newCertifications[index], [field]: value }
    setCertifications(newCertifications)
  }

  const removeCertification = (index: number) => {
    const newCertifications = certifications.filter((_, i) => i !== index)
    setCertifications(newCertifications)
    handleSaveField('certifications', newCertifications)
  }

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header */}
      <div className="pl-1">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Professional Information
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
          Career and professional details for {person.full_name}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basic Professional Info */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                <Briefcase className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <h5 className="text-sm font-medium text-text-primary">Employment</h5>
            </div>

            <div className="space-y-3">
              <CustomInput
                label="Occupation"
                value={occupation}
                onChange={setOccupation}
                placeholder="Enter occupation..."
                variant="filled"
                size="sm"
                leftIcon={<Briefcase className="h-3 w-3" />}
                rightIcon={renderStatusIcon(
                  'occupation',
                  occupation !== (person.occupation || ''),
                  occupation,
                  person.occupation
                )}
              />

              <CustomInput
                label="Employer"
                value={employer}
                onChange={setEmployer}
                placeholder="Enter employer..."
                variant="filled"
                size="sm"
                leftIcon={<Building className="h-3 w-3" />}
                rightIcon={renderStatusIcon(
                  'employer',
                  employer !== (person.employer || ''),
                  employer,
                  person.employer
                )}
              />

              <CustomInput
                label="Job Title"
                value={jobTitle}
                onChange={setJobTitle}
                placeholder="Enter job title..."
                variant="filled"
                size="sm"
                rightIcon={renderStatusIcon(
                  'job_title',
                  jobTitle !== (person.job_title || ''),
                  jobTitle,
                  person.job_title
                )}
              />

              <CustomInput
                label="Tax Identification Number"
                value={taxId}
                onChange={setTaxId}
                placeholder="Enter tax ID..."
                variant="filled"
                size="sm"
                rightIcon={renderStatusIcon(
                  'tax_identification_number',
                  taxId !== (person.tax_identification_number || ''),
                  taxId,
                  person.tax_identification_number
                )}
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
                <Code className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <h5 className="text-sm font-medium text-text-primary">Skills</h5>
            </div>

            <CustomTag
              tags={skills}
              onTagsChange={setSkills}
              placeholder="Add skill..."
              allowDuplicates={false}
            />
            {renderStatusIcon(
              'skills',
              JSON.stringify(skills) !== JSON.stringify(person.skills || []),
              skills,
              person.skills
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="lg:col-span-2 bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-50 dark:bg-orange-900/20 rounded flex items-center justify-center">
                  <Languages className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
                <h5 className="text-sm font-medium text-text-primary">Languages</h5>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addLanguage}
                className="text-xs"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Language
              </Button>
            </div>

            <div className="space-y-3">
              {languages.map((lang, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <CustomInput
                    label="Language"
                    value={lang.language || ''}
                    onChange={(value) => updateLanguage(index, 'language', value)}
                    placeholder="Language name"
                    variant="filled"
                    size="sm"
                  />

                  <CustomCombobox
                    label="Proficiency"
                    value={lang.proficiency || 'basic'}
                    options={PROFICIENCY_OPTIONS}
                    onChange={(value) => updateLanguage(index, 'proficiency', value as string)}
                    size="sm"
                  />

                  <div className="flex items-end gap-2">
                    <div className="flex-1"></div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLanguage(index)}
                      className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {languages.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Languages className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No languages added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Work Experience */}
        <div className="lg:col-span-2 bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center">
                  <Building className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                <h5 className="text-sm font-medium text-text-primary">Work Experience</h5>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addWorkExperience}
                className="text-xs"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Experience
              </Button>
            </div>

            <div className="space-y-4">
              {workExperience.map((exp, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <CustomInput
                      label="Company"
                      value={exp.company || ''}
                      onChange={(value) => updateWorkExperience(index, 'company', value)}
                      placeholder="Company name"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Position"
                      value={exp.position || ''}
                      onChange={(value) => updateWorkExperience(index, 'position', value)}
                      placeholder="Job position"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Start Date"
                      type="datetime-local"
                      showTime={false}
                      value={exp.start_date || ''}
                      onChange={(value) => updateWorkExperience(index, 'start_date', value)}
                      variant="filled"
                      size="sm"
                      leftIcon={<Calendar className="h-3 w-3" />}
                    />

                    <CustomInput
                      label="End Date"
                      type="datetime-local"
                      showTime={false}
                      value={exp.end_date || ''}
                      onChange={(value) => updateWorkExperience(index, 'end_date', value)}
                      variant="filled"
                      size="sm"
                      leftIcon={<Calendar className="h-3 w-3" />}
                    />
                  </div>

                  <CustomInput
                    label="Description"
                    value={exp.description || ''}
                    onChange={(value) => updateWorkExperience(index, 'description', value)}
                    placeholder="Job description and responsibilities"
                    variant="filled"
                    size="sm"
                    multiline
                    rows={2}
                  />

                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorkExperience(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              {workExperience.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No work experience added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="lg:col-span-2 bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
                  <GraduationCap className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <h5 className="text-sm font-medium text-text-primary">Education</h5>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addEducation}
                className="text-xs"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Education
              </Button>
            </div>

            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <CustomInput
                      label="Institution"
                      value={edu.institution || ''}
                      onChange={(value) => updateEducation(index, 'institution', value)}
                      placeholder="School or university"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Degree"
                      value={edu.degree || ''}
                      onChange={(value) => updateEducation(index, 'degree', value)}
                      placeholder="Degree earned"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Field of Study"
                      value={edu.field_of_study || ''}
                      onChange={(value) => updateEducation(index, 'field_of_study', value)}
                      placeholder="Field of study"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Grade"
                      value={edu.grade || ''}
                      onChange={(value) => updateEducation(index, 'grade', value)}
                      placeholder="Grade or GPA"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Start Date"
                      type="datetime-local"
                      showTime={false}
                      value={edu.start_date || ''}
                      onChange={(value) => updateEducation(index, 'start_date', value)}
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="End Date"
                      type="datetime-local"
                      showTime={false}
                      value={edu.end_date || ''}
                      onChange={(value) => updateEducation(index, 'end_date', value)}
                      variant="filled"
                      size="sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              {education.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No education information added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="lg:col-span-2 bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-yellow-50 dark:bg-yellow-900/20 rounded flex items-center justify-center">
                  <Award className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h5 className="text-sm font-medium text-text-primary">Certifications</h5>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addCertification}
                className="text-xs"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Certification
              </Button>
            </div>

            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <CustomInput
                      label="Certification Name"
                      value={cert.name || ''}
                      onChange={(value) => updateCertification(index, 'name', value)}
                      placeholder="Certification name"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Issuing Organization"
                      value={cert.issuing_organization || ''}
                      onChange={(value) =>
                        updateCertification(index, 'issuing_organization', value)
                      }
                      placeholder="Issuing organization"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Issue Date"
                      type="datetime-local"
                      showTime={false}
                      value={cert.issue_date || ''}
                      onChange={(value) => updateCertification(index, 'issue_date', value)}
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Expiry Date"
                      type="datetime-local"
                      showTime={false}
                      value={cert.expiry_date || ''}
                      onChange={(value) => updateCertification(index, 'expiry_date', value)}
                      variant="filled"
                      size="sm"
                    />
                  </div>

                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertification(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              {certifications.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No certifications added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalInfoSection
