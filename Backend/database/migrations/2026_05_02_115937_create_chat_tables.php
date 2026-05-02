<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Conversations (directes ou groupes)
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type')->default('direct');         // direct | groupe
            $table->string('nom')->nullable();                 // nom du groupe
            $table->bigInteger('created_by')->nullable();      // hr_mst_user.id
            $table->timestamps();
        });

        // Participants à chaque conversation
        Schema::create('chat_participants', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('conversation_id')->unsigned();
            $table->bigInteger('staff_id')->unsigned();        // hr_mst_user.id
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();

            $table->foreign('conversation_id')
                  ->references('id')->on('chat_conversations')->onDelete('cascade');
            $table->unique(['conversation_id', 'staff_id']);
        });

        // Messages
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('conversation_id')->unsigned();
            $table->bigInteger('sender_id')->unsigned();       // hr_mst_user.id
            $table->text('content')->nullable();
            $table->string('type')->default('text');           // text | image | file
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('conversation_id')
                  ->references('id')->on('chat_conversations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_participants');
        Schema::dropIfExists('chat_conversations');
    }
};
