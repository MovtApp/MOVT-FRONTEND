-- SQL commands to create chat tables in Supabase

-- Create the chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID NOT NULL REFERENCES auth.users(id),
  participant2_id UUID NOT NULL REFERENCES auth.users(id),
  last_message TEXT,
  last_timestamp TIMESTAMPTZ DEFAULT NOW(),
  unread_count_p1 INTEGER DEFAULT 0,
  unread_count_p2 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  text TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_participant1 ON chats(participant1_id);
CREATE INDEX IF NOT EXISTS idx_chats_participant2 ON chats(participant2_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_timestamp ON chats(last_timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chats
CREATE POLICY "Users can view their own chats" ON chats
  FOR SELECT USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Users can insert their own chats" ON chats
  FOR INSERT WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Users can update their own chats" ON chats
  FOR UPDATE USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their chats" ON messages
  FOR SELECT USING (
    chat_id IN (
      SELECT id FROM chats 
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chats" ON messages
  FOR INSERT WITH CHECK (
    chat_id IN (
      SELECT id FROM chats 
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    ) AND sender_id = auth.uid()
  );

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;