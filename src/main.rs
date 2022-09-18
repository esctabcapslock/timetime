use std::os::windows::prelude::{OsStrExt};
use std::{thread,time};
use windows::Win32::{
    UI::WindowsAndMessaging::*,
    UI::Shell,
    Graphics::Gdi::{HBRUSH},
    System::{LibraryLoader},//Console,
    Foundation::{HINSTANCE,HWND,LPARAM,WPARAM,POINT,LRESULT,GetLastError},//RECT,
};
use windows::core::{PCWSTR};

mod nowstate{

    // #[derive(Debug)]
    struct NowState{
        pub window_name:String,
        pub window_path:String,
        pub date:u128
    }

    use std::time;
    use windows::{Win32::{UI::WindowsAndMessaging::*, System::Threading::*,}, core::PWSTR};
    use std::os::windows::prelude::{OsStringExt};
    use rusqlite::{Connection, };

    fn get_now() -> Result<NowState,String> {

        let time = time::SystemTime::now()
            .duration_since(time::UNIX_EPOCH)
            .unwrap()
            .as_millis();

        unsafe {
            let p0 = GetForegroundWindow();
            let mut lpstring:[u16;128] = [0; 128]; 
            let lpstring_len = GetWindowTextW(p0, &mut lpstring);


            let kk = std::ffi::OsString::from_wide(&lpstring[0..(lpstring_len as usize)]).into_string();
            let now_running_window_name = kk.unwrap();
            // println!("now_running_window: {:?}",lpstring);
            println!("now_running_window_name: {}",now_running_window_name);


            let mut lpdwprocessid:u32=0;
            GetWindowThreadProcessId(p0,  &mut lpdwprocessid as *mut u32);

            if lpdwprocessid==0{
                println!("pid is zero!");
                return Err(String::from("pid is zero!"));
            }

            let mut lpexename:[u16;128] = [0; 128]; 
            let mut lpexename_size = lpexename.len() as u32;
            let process_handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION,false, lpdwprocessid);
            let process_handle = match process_handle {
                Ok(handle)=>handle,
                Err(e) => return Err(e.to_string())
            };
            let lpexename_pwstr = PWSTR::from_raw(&mut lpexename as *mut u16);
            QueryFullProcessImageNameW(process_handle, PROCESS_NAME_FORMAT(0), lpexename_pwstr, &mut lpexename_size as *mut u32);

            let mut lpexename_len:usize = lpexename_size as usize;
            for i in 0..lpexename_size{
                if lpexename[i as usize]==0{
                    lpexename_len = i as usize;
                    break;
                }
            }

            let kk = std::ffi::OsString::from_wide(&lpexename[0..lpexename_len]).into_string();
            let now_running_window_path = kk.unwrap();
            println!("now_running_window_path: {}",now_running_window_path);


            return Ok(NowState {
                window_name:now_running_window_name,
                window_path:now_running_window_path,
                date:time,
            })
        }
    }

    pub struct Records{
        last:Option<NowState>, // last get value 
        last_time:u128, // last records time
        last_recorded:bool,
    }

    pub fn create_records()->Records{
        Records{
            last:None,
            last_time:0,
            last_recorded:false,
        }
    }

    impl Records{

        

        pub fn record(&mut self, conn:&Connection){


            let conn_execure = |nowstate:&NowState, conn:&Connection, last_time:&mut u128|{
                println!("[run conn_execure] name:{}",nowstate.window_name);
                *last_time = nowstate.date; // self.last_time의 값을 변경.
                // println!("detail: {:?}",nowstate);
                conn.execute(
                    "INSERT INTO history (name, path, time) values (?1, ?2, ?3)",
                    (&nowstate.window_name, &nowstate.window_path, &(nowstate.date as i64)),
                ).unwrap();
            };

            let nowstate = get_now();
            let nowstate = match nowstate {
                Ok(now)=>now,
                Err(msg) => {
                    println!("Error occurred, msg: {}",msg);

                    if self.last_recorded==false {
                        if let Some(last)=&self.last{
                            conn_execure(last,conn,&mut self.last_time);
                        }
                    }
                    self.last = None;
                    self.last_recorded = false;
                    return ;
                }
            };


            let same_windows = |last_state:&NowState| -> bool{
                (last_state.window_name == nowstate.window_name) && (last_state.window_path == nowstate.window_path)
            };

            let time_can_record = || -> bool{
                nowstate.date - self.last_time > 1000*60
            };
            

            if let Some(last_state) = &self.last{
                if same_windows(last_state){ // last is not same
                    if time_can_record(){
                        conn_execure(&nowstate,conn,&mut self.last_time);
                        self.last_recorded = true;
                    }else{
                        self.last_recorded = false;
                    }
                }else{ 
                    if self.last_recorded == false {
                        conn_execure(&last_state,conn,&mut self.last_time);
                    }
                    conn_execure(&nowstate,conn,&mut self.last_time);
                    self.last_recorded = true;
                }
            }else{
                conn_execure(&nowstate,conn,&mut self.last_time);
                self.last_recorded = true;
            }
            self.last = Some(nowstate); 
        }
    }

   pub fn record_setup()->Connection{
        let conn = Connection::open("history.sqlite").unwrap();

        conn.execute("CREATE TABLE if not exists history (
            time INTEGER PRIMARY KEY NOT NULL UNIQUE,
            name TEXT NOT NULL,
            path TEXT NOT NULL
        );", ()).unwrap();
        conn
    }

}



fn str_to_osstring(s:&str)-> [u16;128]{
    let mut out: [u16; 128] = [0; 128]; //fill with 0's
    let os_str = std::ffi::OsStr::new(&s); //convert to OS string format or something
    let os_str_utf16 = os_str.encode_wide().collect::<Vec<u16>>(); //now actually convert to UTF16 format for the OS
    out[..os_str_utf16.len()].copy_from_slice(&os_str_utf16); 
    out
}


fn create_msgbox(){
    //https://wesleywiser.github.io/post/rust-windows-messagebox-hello-world/
    let _k = unsafe{MessageBoxW(
        None, 
        PCWSTR::from_raw(&mut str_to_osstring("body") as *mut u16), 
        PCWSTR::from_raw(&mut str_to_osstring("title") as *mut u16), 
        MB_OK | MB_ICONINFORMATION
    )};
}



fn exit(nid:&mut Shell::NOTIFYICONDATAW){
    unsafe{Shell::Shell_NotifyIconW(Shell::NIM_DELETE, nid as *mut Shell::NOTIFYICONDATAW)};
    // NIM_ADD,  NIM_MODIFY, NIM_DELETE
}

const WM_MYMESSAGE:u32 = WM_APP + 100; //prep WM_MYMESSAGE
fn main(){
    // display a backtrace
    use std::env;
    env::set_var("RUST_BACKTRACE", "1");
    let conn = nowstate::record_setup();
    let dur_sleep = time::Duration::from_secs(1);


    // https://stackoverflow.com/questions/54047397/how-to-make-a-tray-icon-for-windows-using-the-winapi-crate
    // https://docs.microsoft.com/en-us/windows/win32/shell/notification-area
    // https://docs.microsoft.com/ko-kr/windows/win32/shell/notification-area
    // https://www.codeproject.com/Articles/4768/Basic-use-of-Shell-NotifyIcon-in-Win32
    // https://social.msdn.microsoft.com/Forums/windows/en-US/a4d7e039-6654-4068-80b2-cd380530d92e/examples-using-win32-api-and-c-for-notification-tray-program?forum=vcgeneral


    // tray disappears on mouse over
    // https://stackoverflow.com/questions/6722214/icon-added-to-notification-tray-disappears-on-mouse-over
    

    fn show_context_menu(hWnd:HWND){
        println!("[show_context_menu]");
        unsafe{
            let mut pt = POINT::default();
            GetCursorPos(&mut pt as &mut POINT);
            println!("mouse cuser: [{},{}]",pt.x, pt.y,);
            let h_menu = CreatePopupMenu().unwrap(); 

            // https://stackoverflow.com/questions/4145561/system-tray-context-menu-doesnt-disappear
            SetForegroundWindow(hWnd);

            let m = MENUINFO {
                cbSize: std::mem::size_of::<MENUINFO>() as u32,
                fMask: MIM_APPLYTOSUBMENUS | MIM_STYLE,
                dwStyle: MNS_NOTIFYBYPOS,
                cyMax: 0 as u32,
                hbrBack: HBRUSH(0),
                dwContextHelpID: 0 as u32,
                dwMenuData: 0 as usize,
            };
            //https://docs.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-menuinfo
            SetMenuInfo(h_menu, &m as *const MENUINFO).unwrap();


            InsertMenuW(h_menu, 0, MF_BYPOSITION, 1, PCWSTR::from_raw(&mut str_to_osstring("exit") as *mut u16));
            InsertMenuW(h_menu, 0, MF_BYPOSITION, 0, PCWSTR::from_raw(&mut str_to_osstring("open GUI") as *mut u16));
            // AppendMenuW(hMenu, MF_STRING, IDM_CONTEXT_LINE, "Line");
            TrackPopupMenu(h_menu, TPM_BOTTOMALIGN, pt.x, pt.y, 0, hWnd, std::ptr::null_mut());
        }
    }

    unsafe extern "system" fn wnd_proc (hWND:HWND, message:u32, wPARM:WPARAM, lParam:LPARAM)->LRESULT {
        // println!("[wnd_proc], message:{}, WM_MYMESSAGE:{}, WM_MENUCOMMAND:{}, WM_USER:{}, WM_DESTROY:{}",message,WM_MYMESSAGE,WM_MENUCOMMAND,WM_USER, WM_DESTROY);
        match message{
            WM_MYMESSAGE =>{
                // println!("lParam?? {:?}",lParam.0);
                match lParam.0 as u32 {
                    WM_LBUTTONDBLCLK => {}
                    WM_RBUTTONUP =>{show_context_menu(hWND)}
                    _ =>{}
                }
            }
            WM_MENUCOMMAND => {
                println!("cnt menu click wPARM:{:?}",wPARM);
                match wPARM {
                    WPARAM(0) =>{}
                    WPARAM(1) =>{}
                    _=>{}
                }
            }
            _ => {}
        }
        DefWindowProcW(hWND, message, wPARM, lParam)
    }

    let h_instance = unsafe{LibraryLoader::GetModuleHandleW(PCWSTR::null()).unwrap()};
    let mut class_name = str_to_osstring("tooltip_test");
    let class_name = PCWSTR::from_raw(&mut class_name as *mut u16);


    let mut wcex = unsafe{ WNDCLASSEXW{
        cbSize: std::mem::size_of::<WNDCLASSEXW>() as u32,
        cbClsExtra: 0, //사용x
        cbWndExtra: 0, //사용x
        hbrBackground: HBRUSH(16), //하얀색창
        hCursor: LoadCursorW(HINSTANCE(0), IDC_ARROW).unwrap(), // 커서불러오기
        hIcon: LoadIconW(HINSTANCE(0), IDI_APPLICATION).unwrap(), //아이콘불러오기
        hIconSm: LoadIconW(HINSTANCE(0), IDI_APPLICATION).unwrap(), //작은아이콘
        hInstance: h_instance, //모듈값
        lpfnWndProc: Some(wnd_proc), //메세지 콜백함수
        lpszClassName: class_name, //윈도우의 클래스이름
        lpszMenuName: PCWSTR::null(), //사용x
        style: CS_HREDRAW | CS_VREDRAW, //창 스타일
    }};

    let k = unsafe{RegisterClassExW(&mut wcex as *mut WNDCLASSEXW)};
    println!("RegisterClassExW k:{}",k);

    unsafe{
        let k = GetLastError();
        println!("ERROR:{:?}",k);
    }

    let window_hwnd = unsafe{
        CreateWindowExW(
            WINDOW_EX_STYLE(0),
            class_name,
            class_name,
            WS_OVERLAPPEDWINDOW,
            CW_USEDEFAULT,CW_USEDEFAULT,
            CW_USEDEFAULT,CW_USEDEFAULT,
            HWND(0),
            HMENU(0),
            HINSTANCE(0),
            std::ptr::null_mut()
        )
    };
    unsafe{
        let k = GetLastError();
        println!("ERROR:{:?}",k);
    }
    
    // println!("window_hwnd : {:?}",window_hwnd);
    
    
    let mut nid = Shell::NOTIFYICONDATAW::default();
    nid.cbSize = std::mem::size_of::<Shell::NOTIFYICONDATAW>() as u32;
    nid.hWnd = window_hwnd;
    nid.uID = 1001;
    nid.uCallbackMessage = WM_MYMESSAGE;
    unsafe{ nid.hIcon = LoadIconW(HINSTANCE::default(), IDI_APPLICATION).unwrap(); }//icon idk
    nid.szTip = str_to_osstring("2");
    nid.uFlags = Shell::NIF_MESSAGE | Shell::NIF_ICON | Shell::NIF_TIP; 
    // nid.hWnd.call

    unsafe{Shell::Shell_NotifyIconW(Shell::NIM_ADD,&mut nid as *mut Shell::NOTIFYICONDATAW)};
    // NIM_ADD, NIM_MODIFY, NIM_DELETE


    let mut records = nowstate::create_records();
    thread::spawn(move || {
        loop{
            records.record(&conn);
            thread::sleep(dur_sleep);
        }
    });
    
    unsafe{
        let mut lpmsg = MSG::default();
        while GetMessageW(&mut lpmsg as *mut MSG, HWND::default(), 0, 0).as_bool(){
            TranslateMessage(&mut lpmsg);
            DispatchMessageW(&mut lpmsg);
        }
    }

}
