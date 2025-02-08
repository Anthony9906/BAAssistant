-- Create docs table
CREATE TABLE IF NOT EXISTS docs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    template_prompt TEXT,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_docs_updated_at
    BEFORE UPDATE ON docs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE docs ENABLE ROW LEVEL SECURITY;

-- Allow read access to users who can access the related chat
CREATE POLICY "Allow read access to chat participants"
ON docs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chats
        WHERE chats.id = docs.chat_id
        AND chats.user_id = auth.uid()
    )
);

-- Allow insert access to users who can access the related chat
CREATE POLICY "Allow insert access to chat participants"
ON docs FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chats
        WHERE chats.id = chat_id
        AND chats.user_id = auth.uid()
    )
);

-- Allow update access to users who can access the related chat
CREATE POLICY "Allow update access to chat participants"
ON docs FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chats
        WHERE chats.id = docs.chat_id
        AND chats.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chats
        WHERE chats.id = chat_id
        AND chats.user_id = auth.uid()
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS docs_chat_id_idx ON docs(chat_id);
CREATE INDEX IF NOT EXISTS docs_created_at_idx ON docs(created_at);
