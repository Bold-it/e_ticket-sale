import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create admin user with simple credentials
    const adminEmail = 'admin@eventlink.gh';
    const adminPassword = 'admin123456';

    // Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ 
            message: 'Admin user already exists',
            email: adminEmail,
            password: 'Use your existing password'
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      throw authError;
    }

    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin',
      });

    if (roleError && !roleError.message.includes('duplicate')) {
      throw roleError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        credentials: {
          email: adminEmail,
          password: adminPassword,
        },
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
