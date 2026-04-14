"""
Management command to seed the database with sample data for development/demo.
Creates sample users, chat rooms, messages, and notifications.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from chat.models import ChatRoom, Message
from notifications.models import Notification

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with sample data for development'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding database...\n')

        # Create sample users
        users_data = [
            {'username': 'alice', 'email': 'alice@example.com', 'password': 'TestPass123!', 'bio': 'Full-stack developer 🚀'},
            {'username': 'bob', 'email': 'bob@example.com', 'password': 'TestPass123!', 'bio': 'Backend engineer 💻'},
            {'username': 'charlie', 'email': 'charlie@example.com', 'password': 'TestPass123!', 'bio': 'Frontend specialist ✨'},
            {'username': 'diana', 'email': 'diana@example.com', 'password': 'TestPass123!', 'bio': 'DevOps engineer 🔧'},
            {'username': 'eve', 'email': 'eve@example.com', 'password': 'TestPass123!', 'bio': 'Data scientist 📊'},
        ]

        users = []
        for data in users_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'username': data['username'],
                    'bio': data['bio'],
                }
            )
            if created:
                user.set_password(data['password'])
                user.save()
                self.stdout.write(f'  ✅ Created user: {user.username} ({user.email})')
            else:
                self.stdout.write(f'  ⏩ User already exists: {user.username}')
            users.append(user)

        alice, bob, charlie, diana, eve = users

        # Create direct chat rooms
        direct_rooms = [
            (alice, bob),
            (alice, charlie),
            (bob, diana),
            (charlie, eve),
        ]

        rooms = []
        for user1, user2 in direct_rooms:
            room, created = ChatRoom.objects.get_or_create(
                room_type='direct',
                defaults={'created_by': user1}
            )
            if created:
                room.members.add(user1, user2)
                self.stdout.write(f'  ✅ Created direct room: {user1.username} ↔ {user2.username}')
            rooms.append(room)

        # Fix: Get or create direct rooms properly
        for i, (user1, user2) in enumerate(direct_rooms):
            existing = ChatRoom.objects.filter(
                room_type='direct', members=user1
            ).filter(members=user2).first()

            if not existing:
                room = ChatRoom.objects.create(
                    room_type='direct', created_by=user1
                )
                room.members.add(user1, user2)
                rooms[i] = room
                self.stdout.write(f'  ✅ Created direct room: {user1.username} ↔ {user2.username}')
            else:
                rooms[i] = existing

        # Create group chat room
        group_room = ChatRoom.objects.filter(
            room_type='group', name='Tech Team'
        ).first()

        if not group_room:
            group_room = ChatRoom.objects.create(
                name='Tech Team',
                room_type='group',
                created_by=alice
            )
            group_room.members.add(alice, bob, charlie, diana, eve)
            self.stdout.write('  ✅ Created group room: Tech Team')

        # Create sample messages
        sample_messages = [
            (rooms[0], alice, "Hey Bob! How's the project going?"),
            (rooms[0], bob, "Going great! Just finished the API endpoints."),
            (rooms[0], alice, "Awesome! Can you send me the docs?"),
            (rooms[0], bob, "Sure, I'll share them in a bit 📄"),
            (rooms[1], alice, "Charlie, the new UI looks amazing!"),
            (rooms[1], charlie, "Thanks Alice! Spent a lot of time on the animations ✨"),
            (group_room, alice, "Team, let's discuss the sprint goals 🎯"),
            (group_room, bob, "I can present the backend architecture"),
            (group_room, charlie, "I'll demo the new chat UI"),
            (group_room, diana, "I'll cover the deployment pipeline 🚀"),
            (group_room, eve, "And I'll share the analytics dashboard progress"),
        ]

        msg_count = 0
        for room, sender, content in sample_messages:
            if not Message.objects.filter(room=room, sender=sender, content=content).exists():
                Message.objects.create(room=room, sender=sender, content=content)
                msg_count += 1

        self.stdout.write(f'  ✅ Created {msg_count} sample messages')

        # Create sample notifications
        notif_data = [
            (bob, 'message', 'New message from Alice', "Hey Bob! How's the project going?", rooms[0]),
            (charlie, 'message', 'New message from Alice', 'Charlie, the new UI looks amazing!', rooms[1]),
            (alice, 'room_invite', 'Group Invite', 'You were added to Tech Team', group_room),
        ]

        notif_count = 0
        for user, n_type, title, message, room in notif_data:
            if not Notification.objects.filter(user=user, title=title).exists():
                Notification.objects.create(
                    user=user,
                    notification_type=n_type,
                    title=title,
                    message=message,
                    related_room=room
                )
                notif_count += 1

        self.stdout.write(f'  ✅ Created {notif_count} sample notifications')

        # Create superuser
        if not User.objects.filter(is_superuser=True).exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='AdminPass123!'
            )
            self.stdout.write(f'  ✅ Created superuser: admin (admin@example.com / AdminPass123!)')

        self.stdout.write(self.style.SUCCESS('\n✨ Database seeded successfully!'))
        self.stdout.write('\n📋 Sample Accounts:')
        self.stdout.write('  Email: alice@example.com  |  Password: TestPass123!')
        self.stdout.write('  Email: bob@example.com    |  Password: TestPass123!')
        self.stdout.write('  Email: charlie@example.com|  Password: TestPass123!')
        self.stdout.write('  Email: admin@example.com  |  Password: AdminPass123!')
