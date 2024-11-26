CC = gcc
CFLAGS = -Wall -Wextra
LIBS = -lwebsockets -ljson-c

TARGET = file_explorer_server
SRCS = main.cpp
OBJS = $(SRCS:.c=.o)

$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $(TARGET) $(LIBS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)