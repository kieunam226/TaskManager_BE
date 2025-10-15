const mongoose = require('mongoose');
const Task = require('./models/Task'); // Đường dẫn tới model Task của bạn

// Thay YOUR_MONGODB_URI bằng connection string của bạn
const MONGODB_URI = 'mongodb+srv://test:P%40ssWord2222@taskmanager.ftejcyh.mongodb.net/?retryWrites=true&w=majority&appName=taskManager';

const fixDatabase = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Sửa các trường array bị null/undefined
    console.log('Fixing null/undefined arrays...');
    
    const fixArrays = await Task.updateMany(
      {
        $or: [
          { todoChecklist: null },
          { todoChecklist: { $exists: false } },
          { assignedTo: null },
          { assignedTo: { $exists: false } },
          { attachments: null },
          { attachments: { $exists: false } }
        ]
      },
      [
        {
          $set: {
            todoChecklist: { $ifNull: ['$todoChecklist', []] },
            assignedTo: { $ifNull: ['$assignedTo', []] },
            attachments: { $ifNull: ['$attachments', []] }
          }
        }
      ]
    );
    
    console.log(`Fixed ${fixArrays.modifiedCount} documents with null arrays`);

    // 2. Sửa status values
    console.log('Fixing status values...');
    
    const fixPending = await Task.updateMany(
      { status: 'Pending' },
      { $set: { status: 'pending' } }
    );
    console.log(`Fixed ${fixPending.modifiedCount} Pending status`);

    const fixInProgress = await Task.updateMany(
      { status: { $in: ['In process', 'In Progress', 'in process'] } },
      { $set: { status: 'in-progress' } }
    );
    console.log(`Fixed ${fixInProgress.modifiedCount} In Progress status`);

    const fixCompleted = await Task.updateMany(
      { status: 'Completed' },
      { $set: { status: 'completed' } }
    );
    console.log(`Fixed ${fixCompleted.modifiedCount} Completed status`);

    // 3. Sửa priority values (nếu cần)
    console.log('Fixing priority values...');
    
    const fixPriority = await Task.updateMany(
      { priority: { $nin: ['low', 'medium', 'high'] } },
      { $set: { priority: 'medium' } }
    );
    console.log(`Fixed ${fixPriority.modifiedCount} invalid priority values`);

    // 4. Thêm progress field cho các task chưa có
    console.log('Adding missing progress field...');
    
    const addProgress = await Task.updateMany(
      { progress: { $exists: false } },
      { $set: { progress: 0 } }
    );
    console.log(`Added progress field to ${addProgress.modifiedCount} tasks`);

    // 5. Kiểm tra và báo cáo
    const totalTasks = await Task.countDocuments();
    const validTasks = await Task.countDocuments({
      todoChecklist: { $exists: true, $type: 'array' },
      assignedTo: { $exists: true, $type: 'array' },
      attachments: { $exists: true, $type: 'array' },
      status: { $in: ['pending', 'in-progress', 'completed'] },
      priority: { $in: ['low', 'medium', 'high'] }
    });

    console.log(`\n=== Summary ===`);
    console.log(`Total tasks: ${totalTasks}`);
    console.log(`Valid tasks: ${validTasks}`);
    console.log(`Invalid tasks: ${totalTasks - validTasks}`);

    // Hiển thị một vài task mẫu sau khi sửa
    const sampleTasks = await Task.find({}).limit(2);
    console.log('\nSample tasks after fix:');
    console.log(JSON.stringify(sampleTasks, null, 2));

  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Chạy script
fixDatabase();