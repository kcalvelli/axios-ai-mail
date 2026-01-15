import sys
import argparse
import json
import os
import email
from email.policy import default
import notmuch

# Import from the existing classifier module
# Expect script to be run from 'src' directory or with PYTHONPATH set
try:
    from ai_classifier import classify_email, extract_text, load_config
except ImportError:
    # Fallback if running directly from project root without PYTHONPATH
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from ai_classifier import classify_email, extract_text, load_config

def main():
    parser = argparse.ArgumentParser(description="Re-classify existing emails with new AI logic")
    parser.add_argument("--query", type=str, default="tag:inbox", help="Notmuch query to select emails (default: tag:inbox)")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of emails to process (0 = no limit)")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without applying changes")
    args = parser.parse_args()

    config = load_config()
    ai_config = config.get("ai", {})
    endpoint = ai_config.get("endpoint", "http://localhost:11434")
    model = ai_config.get("model", "llama3")
    
    if not ai_config.get("enable", True): # Default to true if manual run?
        print("AI is disabled in config.json")
        # Proceed anyway?
    
    # Locate DB
    try:
        config_path = os.environ.get("NOTMUCH_CONFIG", os.path.expanduser("~/.notmuch-config"))
        db_path = None
        if os.path.exists(config_path):
             with open(config_path, 'r') as f:
                for line in f:
                    if line.strip().startswith("path="):
                        db_path = line.split("=", 1)[1].strip()
                        break
        
        if db_path:
             db = notmuch.Database(path=db_path, mode=notmuch.Database.MODE.READ_WRITE)
        else:
             db = notmuch.Database(mode=notmuch.Database.MODE.READ_WRITE)
    except Exception as e:
        print(f"Error opening Notmuch DB: {e}")
        sys.exit(1)

    query = db.create_query(args.query)
    total = query.count_messages()
    print(f"Found {total} messages matching '{args.query}'")
    
    msgs = query.search_messages()
    count = 0
    
    for msg in msgs:
        if args.limit > 0 and count >= args.limit:
            print("Limit reached.")
            break
            
        count += 1
        # Handle unicode subjects gracefully
        try:
             subject = msg.get_header("subject")
        except:
             subject = "(No Subject)"
             
        sender = msg.get_header("from")
        print(f"[{count}/{total}] {subject[:40]}...", end=" ", flush=True)
        
        file_path = msg.get_filename()
        try:
            with open(file_path, 'rb') as f:
                email_obj = email.message_from_binary_file(f, policy=default)
                body = extract_text(email_obj)
        except Exception as e:
            print(f" -> Error reading body: {e}")
            continue

        content = f"From: {sender}\nSubject: {subject}\n\n{body}"
        result_json_str = classify_email(content, endpoint, model)
        
        if result_json_str:
            try:
                result = json.loads(result_json_str)
                tags = result.get("tags", [])
                priority = result.get("priority", "normal")
                action = result.get("action_required", False)
                archive = result.get("can_archive", False)
                
                print(f" -> Tags: {tags} | Prio: {priority} | Action: {action}")
                
                if not args.dry_run:
                    # Remove legacy/conflicting tags to ensure clean state
                    # We don't remove 'inbox' or 'archive' here immediately, we handle that in logic
                    tags_to_wipe = ['new', 'important', 'neutral', 'junk', 'todo', 'prio-high', 'prio-normal']
                    for t in tags_to_wipe:
                         msg.remove_tag(t)
                    
                    # Apply new categorical tags
                    for t in tags:
                        t = t.lower().strip()
                        if t: msg.add_tag(t)
                    
                    # Apply Metadata
                    msg.add_tag(f"prio-{priority}")
                    if action: msg.add_tag("todo")
                    
                    # Lifecycle Logic
                    if "junk" in tags:
                        msg.remove_tag("inbox")
                        msg.add_tag("junk")
                    elif archive and not action:
                        msg.remove_tag("inbox")
                        msg.add_tag("archive")
                    
                    # Note: We do NOT explicitly 'add' inbox tag if missing, 
                    # assuming we are iterating over 'tag:inbox' usually.
                    
            except json.JSONDecodeError:
                print(" -> JSON Parsing Failed")
        else:
            print(" -> API Failed")

if __name__ == "__main__":
    main()
