import { useState, useCallback } from 'react'
import { insforge } from '../insforge'
import { FULL_ACCESS_ROLES } from '../constants/roles'

export function useLeads(profile) {
  const [leads, setLeads]     = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetchLeads = useCallback(async (filters = {}) => {
    if (!profile) return
    setIsLoading(true)
    setError(null)
    try {
      let query = insforge.database
        .from('leads')
        .select('*, assigned_agent:user_profiles!leads_assigned_to_fkey(id, full_name), project:projects!leads_project_id_fkey(id, name)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      // Agents only see their own leads
      if (!FULL_ACCESS_ROLES.includes(profile.role)) {
        query = query.eq('assigned_to', profile.id)
      }

      if (filters.stage)       query = query.eq('pipeline_stage', filters.stage)
      if (filters.source)      query = query.eq('source', filters.source)
      if (filters.project_id)  query = query.eq('project_id', filters.project_id)
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,mobile.ilike.%${filters.search}%`
        )
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setLeads(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [profile])

  const addLead = useCallback(async (leadData) => {
    const { data, error } = await insforge.database
      .from('leads')
      .insert([{ ...leadData, created_by: profile.id }])
      .select()
      .single()
    if (error) throw error

    await insforge.database.from('activity_log').insert([{
      action_type:  'create',
      entity_type:  'lead',
      entity_id:    data.id,
      new_value:    `Lead created: ${leadData.full_name}`,
      performed_by: profile.id,
    }])

    return data
  }, [profile])

  const updateLead = useCallback(async (id, updates, oldLead = {}) => {
    const { data, error } = await insforge.database
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    await insforge.database.from('activity_log').insert([{
      action_type:  'update',
      entity_type:  'lead',
      entity_id:    id,
      old_value:    JSON.stringify(oldLead),
      new_value:    JSON.stringify(updates),
      performed_by: profile.id,
    }])

    return data
  }, [profile])

  const checkDuplicate = useCallback(async (mobile) => {
    if (!mobile || mobile.trim().length < 8) return null
    const { data } = await insforge.database
      .from('leads')
      .select('id, full_name, mobile')
      .eq('mobile', mobile.trim())
      .eq('is_deleted', false)
      .maybeSingle()
    return data
  }, [])

  return { leads, isLoading, error, fetchLeads, addLead, updateLead, checkDuplicate }
}
