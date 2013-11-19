#include <v8.h>
#include <node.h>
#include <sys/vfs.h>

using namespace node;
using namespace v8;

static Handle<Value> statfsNode(const Arguments& args)
{
	if (! args[0]->IsString())
		return Object::New();
		
	struct statfs s;
	v8::String::Utf8Value mountpoint(args[0]->ToString());
		
	statfs(*mountpoint, &s);
	
	Handle<Object> statfsObject = Object::New();
	
	statfsObject->Set(String::New("f_type"), Integer::New(s.f_type));
	statfsObject->Set(String::New("f_bsize"), Integer::New(s.f_bsize));
	statfsObject->Set(String::New("f_blocks"), Integer::New(s.f_blocks));
	statfsObject->Set(String::New("f_bfree"), Integer::New(s.f_bfree));
	statfsObject->Set(String::New("f_bavail"), Integer::New(s.f_bavail));
	statfsObject->Set(String::New("f_files"), Integer::New(s.f_files));
	statfsObject->Set(String::New("f_ffree"), Integer::New(s.f_ffree));
	statfsObject->Set(String::New("f_namelen"), Integer::New(s.f_namelen));
	statfsObject->Set(String::New("f_frsize"), Integer::New(s.f_frsize));
	
	return statfsObject;
}

extern "C" void init(Handle<Object> target)
{
  NODE_SET_METHOD(target, "statfsSync", statfsNode);
}
