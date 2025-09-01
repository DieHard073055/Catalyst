# 🚀 Deployment Checklist

## Pre-Deployment
- [ ] All features tested locally
- [ ] Code pushed to GitHub repository
- [ ] Local Supabase instance working properly
- [ ] Environment variables documented

## Supabase Setup
- [ ] Create new Supabase project
- [ ] Save project credentials (URL, anon key, service role key)
- [ ] Run `setup-production.sql` in SQL Editor
- [ ] Verify all tables created successfully
- [ ] Verify RLS policies are active
- [ ] Create `temp-logos` storage bucket
- [ ] Test storage bucket policies

## Vercel Deployment
- [ ] Connect GitHub repository to Vercel
- [ ] Set framework preset to Next.js
- [ ] Configure environment variables in Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Deploy application
- [ ] Verify build successful
- [ ] Test deployment URL

## Post-Deployment Setup
- [ ] Create admin user account on live site
- [ ] Get user ID from Supabase auth dashboard
- [ ] Promote user to admin in database:
  ```sql
  INSERT INTO admin_users (user_id) VALUES ('your-user-id');
  UPDATE user_profiles SET role = 'admin', credits = 1000 WHERE id = 'your-user-id';
  ```
- [ ] Configure Supabase Auth settings:
  - [ ] Add production domain to Site URL
  - [ ] Add redirect URLs

## Testing
- [ ] User registration/login works
- [ ] Dashboard loads correctly
- [ ] Simple QR Generator functions
- [ ] Custom QR Studio unlock system works
- [ ] Logo upload functionality works
- [ ] Admin panel accessible
- [ ] Credit system working
- [ ] Feature unlocks working

## Security
- [ ] RLS enabled on all tables
- [ ] Service role key only in environment variables
- [ ] Storage policies working correctly
- [ ] No sensitive data in repository
- [ ] HTTPS working correctly

## Optional Optimizations
- [ ] Set up custom domain in Vercel
- [ ] Configure email templates in Supabase
- [ ] Add analytics (Vercel Analytics)
- [ ] Set up error monitoring (Sentry)
- [ ] Configure uptime monitoring

## Final Steps
- [ ] Update DNS if using custom domain
- [ ] Create backup of database schema
- [ ] Document production URLs and credentials
- [ ] Share access with team members
- [ ] Monitor initial traffic and performance

---

## 🔗 Production URLs
- **App**: https://your-project.vercel.app
- **Admin**: https://your-project.vercel.app/admin
- **Supabase**: https://your-project-id.supabase.co

## 🆘 Emergency Contacts
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.com

## 📊 Post-Launch Monitoring
- [ ] Check error rates in Vercel dashboard
- [ ] Monitor database performance in Supabase
- [ ] Track user registrations and feature usage
- [ ] Monitor storage bucket usage and costs