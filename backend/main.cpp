#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <dirent.h>
#include <time.h>
#include <libwebsockets.h>
#include <json-c/json.h>

#define MAX_PAYLOAD 4096
#define PORT 3001
#define STORAGE_DIR "./storage"

struct per_session_data {
    int id;
};

static json_object* get_file_info(const char* base_path, const char* name, struct stat* st) {
    json_object* file_obj = json_object_new_object();
    
    json_object_object_add(file_obj, "name", json_object_new_string(name));
    
    char full_path[512];
    snprintf(full_path, sizeof(full_path), "%s/%s", base_path, name);
    char virtual_path[512];
    snprintf(virtual_path, sizeof(virtual_path), "/%s", name);
    json_object_object_add(file_obj, "path", json_object_new_string(virtual_path));
    
    json_object_object_add(file_obj, "isDirectory", json_object_new_boolean(S_ISDIR(st->st_mode)));
    json_object_object_add(file_obj, "size", json_object_new_int64(st->st_size));
    
    char modified_time[32];
    strftime(modified_time, sizeof(modified_time), "%Y-%m-%dT%H:%M:%SZ", gmtime(&st->st_mtime));
    json_object_object_add(file_obj, "modified", json_object_new_string(modified_time));
    
    char created_time[32];
    strftime(created_time, sizeof(created_time), "%Y-%m-%dT%H:%M:%SZ", gmtime(&st->st_ctime));
    json_object_object_add(file_obj, "created", json_object_new_string(created_time));
    
    return file_obj;
}

static int handle_list_files(struct lws* wsi, const char* path) {
    char full_path[512];
    snprintf(full_path, sizeof(full_path), "%s%s", STORAGE_DIR, path);
    
    DIR* dir = opendir(full_path);
    if (!dir) {
        json_object* error = json_object_new_object();
        json_object_object_add(error, "type", json_object_new_string("ERROR"));
        json_object_object_add(error, "message", json_object_new_string("Failed to open directory"));
        
        const char* response = json_object_to_json_string(error);
        lws_write(wsi, (unsigned char*)response, strlen(response), LWS_WRITE_TEXT);
        
        json_object_put(error);
        return -1;
    }
    
    json_object* response = json_object_new_object();
    json_object* files_array = json_object_new_array();
    
    struct dirent* entry;
    while ((entry = readdir(dir)) != NULL) {
        if (strcmp(entry->d_name, ".") == 0 || strcmp(entry->d_name, "..") == 0)
            continue;
            
        char entry_path[512];
        snprintf(entry_path, sizeof(entry_path), "%s/%s", full_path, entry->d_name);
        
        struct stat st;
        if (stat(entry_path, &st) == 0) {
            json_object* file_info = get_file_info(full_path, entry->d_name, &st);
            json_object_array_add(files_array, file_info);
        }
    }
    
    closedir(dir);
    
    json_object_object_add(response, "type", json_object_new_string("FILES_LIST"));
    json_object_object_add(response, "data", files_array);
    
    const char* response_str = json_object_to_json_string(response);
    lws_write(wsi, (unsigned char*)response_str, strlen(response_str), LWS_WRITE_TEXT);
    
    json_object_put(response);
    return 0;
}

static int handle_create_folder(struct lws* wsi, const char* path, const char* name) {
    char full_path[512];
    snprintf(full_path, sizeof(full_path), "%s%s/%s", STORAGE_DIR, path, name);
    
    if (mkdir(full_path, 0755) != 0) {
        json_object* error = json_object_new_object();
        json_object_object_add(error, "type", json_object_new_string("ERROR"));
        json_object_object_add(error, "message", json_object_new_string("Failed to create folder"));
        
        const char* response = json_object_to_json_string(error);
        lws_write(wsi, (unsigned char*)response, strlen(response), LWS_WRITE_TEXT);
        
        json_object_put(error);
        return -1;
    }
    
    json_object* response = json_object_new_object();
    json_object_object_add(response, "type", json_object_new_string("FOLDER_CREATED"));
    
    char virtual_path[512];
    snprintf(virtual_path, sizeof(virtual_path), "%s/%s", path, name);
    json_object_object_add(response, "path", json_object_new_string(virtual_path));
    
    const char* response_str = json_object_to_json_string(response);
    lws_write(wsi, (unsigned char*)response_str, strlen(response_str), LWS_WRITE_TEXT);
    
    json_object_put(response);
    return 0;
}

static int callback_file_explorer(struct lws* wsi, enum lws_callback_reasons reason,
                                void* user, void* in, size_t len) {
    struct per_session_data* psd = (struct per_session_data*)user;
    
    switch (reason) {
        case LWS_CALLBACK_ESTABLISHED:
            psd->id = rand();
            printf("Connection established\n");
            break;
            
        case LWS_CALLBACK_RECEIVE: {
            json_object* message = json_tokener_parse((char*)in);
            if (!message) {
                printf("Failed to parse message\n");
                break;
            }
            
            json_object* type_obj;
            json_object_object_get_ex(message, "type", &type_obj);
            const char* type = json_object_get_string(type_obj);
            
            if (strcmp(type, "LIST_FILES") == 0) {
                json_object* path_obj;
                json_object_object_get_ex(message, "path", &path_obj);
                const char* path = json_object_get_string(path_obj);
                handle_list_files(wsi, path);
            }
            else if (strcmp(type, "CREATE_FOLDER") == 0) {
                json_object* path_obj, *name_obj;
                json_object_object_get_ex(message, "path", &path_obj);
                json_object_object_get_ex(message, "name", &name_obj);
                handle_create_folder(wsi, 
                    json_object_get_string(path_obj),
                    json_object_get_string(name_obj));
            }
            // Add handlers for DELETE and RENAME operations
            
            json_object_put(message);
            break;
        }
            
        default:
            break;
    }
    
    return 0;
}

static struct lws_protocols protocols[] = {
    {
        "file-explorer",
        callback_file_explorer,
        sizeof(struct per_session_data),
        MAX_PAYLOAD,
    },
    { NULL, NULL, 0, 0 }
};

int main(void) {
    struct lws_context_creation_info info;
    memset(&info, 0, sizeof info);
    
    info.port = PORT;
    info.protocols = protocols;
    info.gid = -1;
    info.uid = -1;
    
    // Create storage directory if it doesn't exist
    mkdir(STORAGE_DIR, 0755);
    
    struct lws_context* context = lws_create_context(&info);
    if (!context) {
        printf("Failed to create websocket context\n");
        return -1;
    }
    
    printf("Server started on port %d\n", PORT);
    
    while (1) {
        lws_service(context, 50);
    }
    
    lws_context_destroy(context);
    
    return 0;
}