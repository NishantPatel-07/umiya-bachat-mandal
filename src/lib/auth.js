import { supabase } from './supabase'

export const adminSignIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const memberSignIn = (memberNum, pin) =>
  supabase.auth.signInWithPassword({
    email: `umiyamember${memberNum}@gmail.com`,
    password: pin + '_umiya'
  })

export const signOut = () => supabase.auth.signOut()
export const getSession = () => supabase.auth.getSession()
